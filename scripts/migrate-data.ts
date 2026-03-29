/**
 * NUFV Lost & Found — Legacy MySQL → Neon PostgreSQL Migration Script
 *
 * HOW TO RUN:
 *   1. Place this file at: scripts/migrate-data.ts
 *   2. Place your SQL dump at: scripts/legacy.sql
 *   3. Run: npx tsx scripts/migrate-data.ts
 *
 * WHAT IT DOES:
 *   - Migrates users (3 admins)
 *   - Migrates all items (~1000+) with category mapping
 *   - Migrates audit logs (506 records)
 *   - Preserves original item_code as contactInfo for reference
 *   - Maps old status: AVAILABLE → PENDING, CLAIMED → CLAIMED, DISPOSED → DISPOSED
 *   - Maps item_type_id → category name using the exact item_types from your DB
 *   - Combines level_found + specific_place into location field
 *   - PHP bcrypt hashes ($2y$) are re-prefixed to ($2b$) for Node.js bcryptjs compatibility
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { generateItemCode } from '../src/lib/itemCode';

const prisma = new PrismaClient();

// ─── Type Definitions ────────────────────────────────────────────────────────

interface LegacyUser {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
}

interface LegacyItem {
  id: number;
  item_type_id: number;
  item_subcategory_id: number | null;
  item_code: string;
  item_description: string | null;
  image_url: string | null;
  surrendered_by: string | null;
  level_found: string | null;
  specific_place: string | null;
  status: string;
  claimed_by: string | null;
  claimed_date: string | null;
  claimed_at: string | null;
  received_by: string | null;
  date_received: string;
  retention_period: string | null;
  created_at: string;
  updated_at: string;
}

interface LegacyAuditLog {
  id: number;
  item_id: number | null;
  item_code: string | null;
  action: string;
  details: string | null;
  user_id: number | null;
  user_name: string | null;
  user_role: string | null;
  timestamp: string;
  created_at: string;
}

// ─── Category Mapping ─────────────────────────────────────────────────────────
// Maps your legacy item_type_id to the new category string

const ITEM_TYPE_MAP: Record<number, string> = {
  1: 'School Supplies',
  2: 'Electronics',
  3: 'Eyewear',
  4: 'Umbrella',
  5: 'Tumbler',
  6: 'ID',
  7: 'Wallet',
  8: 'Wallet with Cash',
  9: 'Personal Item',
  10: 'Other Materials',
};

// ─── Status Mapping ───────────────────────────────────────────────────────────
// Maps legacy status → new Prisma ItemStatus enum

function mapStatus(legacyStatus: string): 'PENDING' | 'CLAIMED' | 'RETURNED' | 'DISPOSED' {
  switch (legacyStatus.toUpperCase()) {
    case 'AVAILABLE': return 'PENDING';   // Available in old system = Pending in new
    case 'CLAIMED':   return 'CLAIMED';
    case 'RETURNED':  return 'RETURNED';
    case 'DISPOSED':  return 'DISPOSED';
    case 'PENDING':   return 'PENDING';
    default:          return 'PENDING';
  }
}

// ─── Action Mapping ───────────────────────────────────────────────────────────

function mapAction(legacyAction: string): string {
  const map: Record<string, string> = {
    'CREATE':        'ITEM_CREATED',
    'UPDATE':        'ITEM_UPDATED',
    'DELETE':        'ITEM_DELETED',
    'CLAIMED':       'ITEM_CLAIMED',
    'RETURNED':      'ITEM_RETURNED',
    'DISPOSED':      'ITEM_DISPOSED',
    'AUTO_DISPOSED': 'ITEM_AUTO_DISPOSED',
    'LOGIN':         'USER_LOGIN',
    'LOGOUT':        'USER_LOGOUT',
    'PASSWORD_CHANGE': 'USER_PASSWORD_CHANGED',
  };
  return map[legacyAction.toUpperCase()] || legacyAction;
}

// ─── SQL Parser ───────────────────────────────────────────────────────────────
// Extracts INSERT rows from the SQL dump without needing a MySQL connection

function extractInserts(sql: string, tableName: string): string[][] {
  const results: string[][] = [];
  // Match all INSERT INTO `tableName` ... VALUES (...) blocks
  const insertRegex = new RegExp(
    `INSERT INTO \`${tableName}\`[^;]+?VALUES\\s*([\\s\\S]*?);`,
    'gi'
  );

  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    const valuesBlock = match[1];
    // Split into individual row tuples
    const rowRegex = /\(([^)]*(?:\([^)]*\)[^)]*)*)\)/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(valuesBlock)) !== null) {
      const values = parseCSVRow(rowMatch[1]);
      results.push(values);
    }
  }
  return results;
}

function parseCSVRow(row: string): string[] {
  const values: string[] = [];
  let current = '';
  let inString = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];

    if (char === "'" && !inString) {
      inString = true;
      i++;
      continue;
    }

    if (inString) {
      if (char === '\\' && i + 1 < row.length) {
        // Handle escape sequences
        const next = row[i + 1];
        if (next === "'") current += "'";
        else if (next === '\\') current += '\\';
        else if (next === 'n') current += '\n';
        else if (next === 'r') current += '\r';
        else current += next;
        i += 2;
        continue;
      }
      if (char === "'") {
        inString = false;
        i++;
        continue;
      }
      current += char;
      i++;
      continue;
    }

    if (char === ',') {
      values.push(current.trim() === 'NULL' ? '' : current.trim());
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  values.push(current.trim() === 'NULL' ? '' : current.trim());
  return values;
}

function rowToUser(row: string[]): LegacyUser {
  return {
    id:          parseInt(row[0]),
    first_name:  row[1],
    middle_name: row[2] || null,
    last_name:   row[3],
    email:       row[4],
    password:    row[5],
    role:        row[6],
    created_at:  row[7],
  };
}

function rowToItem(row: string[]): LegacyItem {
  return {
    id:                  parseInt(row[0]),
    item_type_id:        parseInt(row[1]),
    item_subcategory_id: row[2] ? parseInt(row[2]) : null,
    item_code:           row[3],
    item_description:    row[4] || null,
    image_url:           row[5] || null,
    surrendered_by:      row[6] || null,
    level_found:         row[7] || null,
    specific_place:      row[8] || null,
    status:              row[9],
    claimed_by:          row[10] || null,
    claimed_date:        row[11] || null,
    claimed_at:          row[12] || null,
    received_by:         row[13] || null,
    date_received:       row[14],
    retention_period:    row[15] || null,
    created_at:          row[16],
    updated_at:          row[17],
  };
}

function rowToAuditLog(row: string[]): LegacyAuditLog {
  return {
    id:        parseInt(row[0]),
    item_id:   row[1] ? parseInt(row[1]) : null,
    item_code: row[2] || null,
    action:    row[3],
    details:   row[4] || null,
    user_id:   row[5] ? parseInt(row[5]) : null,
    user_name: row[6] || null,
    user_role: row[7] || null,
    timestamp: row[8],
    created_at: row[9],
  };
}

// ─── Main Migration ───────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 NUFV Lost & Found — Legacy Migration');
  console.log('========================================\n');

  // Read the SQL dump file
  const sqlPath = path.join(process.cwd(), 'scripts', 'legacy.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ ERROR: SQL dump not found at scripts/legacy.sql');
    console.error('   Place your dump file there and try again.');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8');
  console.log('✅ SQL dump loaded\n');

  // ── Step 1: Migrate Users ──────────────────────────────────────────────────

  console.log('👥 STEP 1: Migrating users...');
  const userRows = extractInserts(sql, 'users');
  const legacyUsers = userRows.map(rowToUser);

  // Map: legacy int ID → new cuid string ID
  const userIdMap = new Map<number, string>();

  let usersCreated = 0;
  let usersSkipped = 0;

  for (const lu of legacyUsers) {
    const fullName = [lu.first_name, lu.middle_name, lu.last_name]
      .filter(Boolean)
      .join(' ');

    // PHP uses $2y$ prefix, Node.js bcryptjs uses $2b$ — they are compatible
    const compatiblePassword = lu.password.replace(/^\$2y\$/, '$2b$');

    // Generate a username from email (part before @)
    const username = lu.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');

    try {
      const existing = await prisma.user.findUnique({ where: { email: lu.email } });

      if (existing) {
        userIdMap.set(lu.id, existing.id);
        usersSkipped++;
        console.log(`   ⏭  Skipped (already exists): ${lu.email}`);
        continue;
      }

      const newUser = await prisma.user.create({
        data: {
          email:     lu.email,
          username:  username,
          password:  compatiblePassword,
          firstName: lu.first_name,
          lastName:  lu.last_name,
          role:      'ADMIN',   // All legacy users were ADMIN/STAFF → ADMIN
          isActive:  true,
          createdAt: new Date(lu.created_at),
        },
      });

      userIdMap.set(lu.id, newUser.id);
      usersCreated++;
      console.log(`   ✅ Created: ${fullName} (${lu.email})`);
    } catch (err: any) {
      console.error(`   ❌ Failed: ${lu.email} — ${err.message}`);
    }
  }

  // Make sure we have a fallback admin for orphaned audit logs
  let fallbackAdminId: string;
  const fallbackAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!fallbackAdmin) {
    console.error('❌ No admin user found — run db:seed first');
    process.exit(1);
  }
  fallbackAdminId = fallbackAdmin.id;

  console.log(`\n   Users created: ${usersCreated}, skipped: ${usersSkipped}\n`);

  // ── Step 2: Migrate Items ─────────────────────────────────────────────────

  console.log('📦 STEP 2: Migrating items...');
  const itemRows = extractInserts(sql, 'items');
  const legacyItems = itemRows.map(rowToItem);

  // Map: legacy int item ID → new cuid string ID (needed for audit logs)
  const itemIdMap = new Map<number, string>();

  let itemsCreated = 0;
  let itemsFailed = 0;

  // Use the first admin as the default reporter (Christopher Joseph Villamin Aureo)
  // Items have received_by (string name) not a FK, so we map by name where possible
  const reporterByName = new Map<string, string>();
  for (const [legacyId, newId] of userIdMap) {
    const lu = legacyUsers.find(u => u.id === legacyId);
    if (lu) {
      const fullName = [lu.first_name, lu.middle_name, lu.last_name].filter(Boolean).join(' ');
      reporterByName.set(fullName, newId);
      // Also map partial matches
      reporterByName.set(`${lu.first_name} ${lu.last_name}`, newId);
      reporterByName.set(lu.last_name, newId);
    }
  }

  for (const li of legacyItems) {
    try {
      const category = ITEM_TYPE_MAP[li.item_type_id] || 'Other Materials';
      const status = mapStatus(li.status);

      // Combine level + specific place into location
      const locationParts = [li.level_found, li.specific_place].filter(
        p => p && p.trim() && p.trim().toLowerCase() !== 'unspecified'
      );
      const location = locationParts.length > 0 ? locationParts.join(' — ') : 'Unspecified';

      // Find reporter by received_by name
      let reporterId = fallbackAdminId;
      if (li.received_by) {
        const trimmed = li.received_by.trim();
        for (const [name, id] of reporterByName) {
          if (trimmed.includes(name) || name.includes(trimmed)) {
            reporterId = id;
            break;
          }
        }
      }

      // Build contactInfo: preserve legacy item_code + surrendered_by info
      const contactParts = [
        `Legacy Code: ${li.item_code}`,
        li.surrendered_by ? `Surrendered by: ${li.surrendered_by}` : null,
        li.claimed_by ? `Claimed by: ${li.claimed_by}` : null,
      ].filter(Boolean);
      const contactInfo = contactParts.join(' | ');

      // Determine item code
      let itemCode: string | null = null;
      if (li.item_code && li.item_code.match(/^ITEM-\d{4}-\d+$/)) {
        // Already in correct format — preserve it
        itemCode = li.item_code;
      } else {
        // Old format (SS-001, E-157, etc.) — store in contactInfo only
        // itemCode stays null and will be assigned if needed
        itemCode = null;
      }

      // Determine claimed fields
      const isClaimed = status === 'CLAIMED';
      const claimedAt = isClaimed && li.claimed_date ? new Date(li.claimed_date) : null;

      // Determine disposed fields
      const isDisposed = status === 'DISPOSED';

      const newItem = await prisma.item.create({
        data: {
          itemCode,
          itemName:    li.item_description || li.item_code,
          description: li.item_description || null,
          category:    category,
          location:    location,
          status:      status,
          imageUrl:    li.image_url || null,
          contactInfo: contactInfo,
          reporterId:  reporterId,
          claimedAt:   claimedAt,
          isDisposed:  isDisposed,
          disposalDate: isDisposed ? new Date(li.updated_at) : null,
          dateReported: new Date(li.date_received),
          createdAt:   new Date(li.created_at),
          updatedAt:   new Date(li.updated_at),
        },
      });

      itemIdMap.set(li.id, newItem.id);
      itemsCreated++;

      if (itemsCreated % 100 === 0) {
        console.log(`   ✅ ${itemsCreated} items migrated...`);
      }
    } catch (err: any) {
      itemsFailed++;
      console.error(`   ❌ Failed item ${li.item_code}: ${err.message}`);
    }
  }

  console.log(`\n   Items created: ${itemsCreated}, failed: ${itemsFailed}\n`);

  // After main migration loop, backfill missing item codes
  console.log('\n🔢 Backfilling item codes for legacy items...');
  const itemsWithoutCode = await prisma.item.findMany({
    where: { itemCode: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  for (const item of itemsWithoutCode) {
    const itemCode = await generateItemCode();
    await prisma.item.update({
      where: { id: item.id },
      data: { itemCode },
    });
  }
  console.log(`   Backfilled ${itemsWithoutCode.length} item codes`);

  // ── Step 3: Migrate Audit Logs ────────────────────────────────────────────

  console.log('📋 STEP 3: Migrating audit logs...');
  const auditRows = extractInserts(sql, 'audit_logs');
  const legacyLogs = auditRows.map(rowToAuditLog);

  let logsCreated = 0;
  let logsFailed = 0;

  for (const la of legacyLogs) {
    try {
      // Resolve user — use fallback if user_id not found
      const userId = la.user_id ? (userIdMap.get(la.user_id) || fallbackAdminId) : fallbackAdminId;

      // Resolve item ID if present
      const entityId = la.item_id ? (itemIdMap.get(la.item_id) || null) : null;

      await prisma.auditLog.create({
        data: {
          userId:     userId,
          action:     mapAction(la.action),
          entityType: la.item_id ? 'ITEM' : 'USER',
          entityId:   entityId,
          details: {
            legacyItemCode: la.item_code || null,
            legacyDetails:  la.details || null,
            legacyUserName: la.user_name || null,
            legacyAction:   la.action,
          },
          ipAddress:  'migrated',
          userAgent:  'migration-script',
          createdAt:  new Date(la.created_at),
        },
      });

      logsCreated++;
    } catch (err: any) {
      logsFailed++;
      if (logsFailed <= 5) {
        console.error(`   ❌ Failed audit log ${la.id}: ${err.message}`);
      }
    }
  }

  console.log(`\n   Audit logs created: ${logsCreated}, failed: ${logsFailed}\n`);

  // ── Step 4: Summary ───────────────────────────────────────────────────────

  console.log('========================================');
  console.log('✅ MIGRATION COMPLETE\n');
  console.log(`   Users migrated:      ${usersCreated} created, ${usersSkipped} skipped`);
  console.log(`   Items migrated:      ${itemsCreated} created, ${itemsFailed} failed`);
  console.log(`   Audit logs migrated: ${logsCreated} created, ${logsFailed} failed`);

  // Count what's in the DB now
  const [totalUsers, totalItems, totalLogs] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.auditLog.count(),
  ]);

  console.log('\n📊 Database totals after migration:');
  console.log(`   Users:      ${totalUsers}`);
  console.log(`   Items:      ${totalItems}`);
  console.log(`   Audit logs: ${totalLogs}`);

  console.log('\n🔑 Staff login credentials (passwords unchanged from legacy):');
  for (const lu of legacyUsers) {
    const fullName = [lu.first_name, lu.middle_name, lu.last_name].filter(Boolean).join(' ');
    console.log(`   ${fullName} → ${lu.email}`);
  }
  console.log('   (Use the same passwords from the old system)\n');
}

main()
  .catch(err => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
