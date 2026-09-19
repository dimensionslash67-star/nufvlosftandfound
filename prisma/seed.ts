import { PrismaClient, type ItemStatus, type UserRole } from '@prisma/client';
import crypto from 'node:crypto';
import { subDays } from 'date-fns';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

// The seed script wipes audit logs and items, so it must never run silently
// against a database that already holds real data. Pass --force to override.
const FORCE = process.argv.includes('--force');
const SB = '--------------------------------------------------';

// Admin seed password: supply via SEED_ADMIN_PASSWORD env var, or one is randomly generated and
// printed ONCE to the console. The password is only applied when the account is first created
// (or re-applied when SEED_ADMIN_PASSWORD is explicitly provided). Never use a hardcoded default.
const SEED_ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ?? crypto.randomBytes(20).toString('hex');
const ADMIN_FORCE_PASSWORD = Boolean(process.env.SEED_ADMIN_PASSWORD);

function randomPassword() {
  return crypto.randomBytes(20).toString('hex');
}

const adminSeed = {
  email: 'admin@nufv.edu',
  username: 'admin',
  password: SEED_ADMIN_PASSWORD,
  firstName: 'System',
  lastName: 'Administrator',
  role: 'ADMIN' as UserRole,
};

// Sample users: every password is randomly generated per run (never a fixed known value).
// Like the admin account, the generated password is applied only on first creation.
const sampleUsers = [
  {
    email: 'maria.cruz@nufv.edu',
    username: 'mcruz',
    password: randomPassword(),
    firstName: 'Maria',
    lastName: 'Cruz',
    role: 'USER' as UserRole,
  },
  {
    email: 'john.reyes@nufv.edu',
    username: 'jreyes',
    password: randomPassword(),
    firstName: 'John',
    lastName: 'Reyes',
    role: 'USER' as UserRole,
  },
  {
    email: 'anne.santos@nufv.edu',
    username: 'asantos',
    password: randomPassword(),
    firstName: 'Anne',
    lastName: 'Santos',
    role: 'USER' as UserRole,
  },
];

const settings = [
  { key: 'site_name', value: 'NUFV Lost and Found' },
  { key: 'max_file_size', value: '5242880' },
  { key: 'item_retention_days', value: '30' },
  { key: 'admin_email', value: 'admin@nufv.edu' },
];

async function ensureSeedAllowed() {
  if (FORCE) {
    console.log('[seed] --force provided; destructive operations will proceed.');
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to seed: NODE_ENV is "production". This script deletes ALL audit logs and items. ' +
        'Set SEED_ADMIN_PASSWORD explicitly if seeding a fresh production database, and confirm with --force.',
    );
  }

  const [userCount, itemCount, auditCount] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.auditLog.count(),
  ]);

  const hasRealUsers = userCount > 5;
  const hasNonSampleItems = itemCount > 10;
  const hasAuditLogs = auditCount > 0;

  if (hasRealUsers || hasNonSampleItems || hasAuditLogs) {
    throw new Error(
      `Refusing to seed: the database already contains data that is not seed sample data ` +
        `(users=${userCount}, items=${itemCount}, auditLogs=${auditCount}). ` +
        'This script deletes ALL audit logs and items. Rerun with --force to override.',
    );
  }
}

type SeedUser = {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

async function upsertUser(user: SeedUser, resetPassword: boolean, createdList: SeedUser[]) {
  const password = await hashPassword(user.password);
  const existing = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });

  const saved = await prisma.user.upsert({
    where: { email: user.email },
    update: {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: true,
      ...(resetPassword ? { password } : {}),
    },
    create: {
      email: user.email,
      username: user.username,
      password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: true,
    },
  });

  if (!existing && !createdList.some((u) => u.email === user.email)) {
    createdList.push(user);
  }

  return saved;
}

async function main() {
  await ensureSeedAllowed();

  console.log(SB);
  console.log('[seed] Seeding NUFV Lost and Found...');
  console.log(SB);

  const created = [] as SeedUser[];

  const admin = await upsertUser(adminSeed, ADMIN_FORCE_PASSWORD, created);
  const users = await Promise.all(sampleUsers.map((u) => upsertUser(u, false, created)));

  await Promise.all(
    settings.map((setting) =>
      prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      }),
    ),
  );

  const preAudit = await prisma.auditLog.count();
  await prisma.auditLog.deleteMany();
  console.log(`[seed] Deleted ${preAudit} audit log records.`);

  const preItems = await prisma.item.count();
  await prisma.item.deleteMany();
  console.log(`[seed] Deleted ${preItems} item records.`);

  const reporters = [admin, ...users];

  const sampleItems: Array<{
    itemName: string;
    description: string;
    category: string;
    location: string;
    status: ItemStatus;
    reporterId: string;
    claimerId?: string | null;
    claimedAt?: Date | null;
    dateReported: Date;
    imageUrl?: string;
    contactInfo?: string;
    dueDate?: Date | null;
    isOverdue?: boolean;
    isDisposed?: boolean;
    disposalDate?: Date | null;
  }> = [
    {
      itemName: 'Black Samsung Phone',
      description: 'Found near the main gate with a cracked case.',
      category: 'Electronics',
      location: 'Main Gate',
      status: 'PENDING',
      reporterId: admin.id,
      dateReported: subDays(new Date(), 2),
      imageUrl: '/images/banner2.jpg',
      contactInfo: 'Security Office',
      dueDate: subDays(new Date(), -7),
    },
    {
      itemName: 'Blue Jansport Backpack',
      description: 'Contains notebooks and a calculator.',
      category: 'Bags',
      location: 'Library 2nd Floor',
      status: 'PENDING',
      reporterId: users[0].id,
      dateReported: subDays(new Date(), 5),
      contactInfo: 'Library Desk',
    },
    {
      itemName: 'Silver House Keys',
      description: 'Three keys with a small basketball keychain.',
      category: 'Keys',
      location: 'Gym Entrance',
      status: 'CLAIMED',
      reporterId: users[1].id,
      claimerId: users[2].id,
      claimedAt: subDays(new Date(), 1),
      dateReported: subDays(new Date(), 8),
      contactInfo: 'PE Department',
    },
    {
      itemName: 'Brown Wallet',
      description: 'Wallet with school ID and some cash.',
      category: 'Wallet with Cash',
      location: 'Cafeteria',
      status: 'RETURNED',
      reporterId: users[2].id,
      claimerId: users[1].id,
      claimedAt: subDays(new Date(), 3),
      dateReported: subDays(new Date(), 9),
      contactInfo: 'Student Affairs',
    },
    {
      itemName: 'White PE Uniform Jacket',
      description: 'Marked with initials J.R.',
      category: 'Clothing',
      location: 'Bleachers',
      status: 'DISPOSED',
      reporterId: admin.id,
      dateReported: subDays(new Date(), 45),
      isDisposed: true,
      disposalDate: subDays(new Date(), 10),
    },
    {
      itemName: 'Red Scientific Calculator',
      description: 'Casio calculator with protective cover.',
      category: 'School Supplies',
      location: 'Room 304',
      status: 'PENDING',
      reporterId: users[0].id,
      dateReported: subDays(new Date(), 4),
      contactInfo: 'Academic Office',
      dueDate: subDays(new Date(), 1),
      isOverdue: true,
    },
    {
      itemName: 'Gold Bracelet',
      description: 'Thin bracelet found near the guidance office.',
      category: 'Jewelry',
      location: 'Guidance Office',
      status: 'PENDING',
      reporterId: users[1].id,
      dateReported: subDays(new Date(), 6),
      contactInfo: 'Guidance Office',
    },
    {
      itemName: 'Green Water Bottle',
      description: 'Insulated bottle with NUFV sticker.',
      category: 'Personal Item',
      location: 'Student Lounge',
      status: 'PENDING',
      reporterId: users[2].id,
      dateReported: subDays(new Date(), 1),
      contactInfo: 'Lost and Found Office',
    },
    {
      itemName: 'Physics Textbook',
      description: 'College physics textbook with notes inside.',
      category: 'Books',
      location: 'Science Lab',
      status: 'CLAIMED',
      reporterId: admin.id,
      claimerId: users[0].id,
      claimedAt: subDays(new Date(), 2),
      dateReported: subDays(new Date(), 12),
      contactInfo: 'Science Department',
    },
    {
      itemName: 'School ID Lace',
      description: 'Blue and gold lace without ID card attached.',
      category: 'Accessories',
      location: 'Registrar Hallway',
      status: 'PENDING',
      reporterId: users[1].id,
      dateReported: subDays(new Date(), 7),
      contactInfo: 'Registrar Office',
    },
  ];

  for (const item of sampleItems) {
    await prisma.item.create({
      data: {
        itemName: item.itemName,
        description: item.description,
        category: item.category,
        location: item.location,
        status: item.status,
        reporterId: item.reporterId,
        claimerId: item.claimerId,
        claimedAt: item.claimedAt,
        dateReported: item.dateReported,
        imageUrl: item.imageUrl,
        contactInfo: item.contactInfo,
        dueDate: item.dueDate,
        isOverdue: item.isOverdue ?? false,
        isDisposed: item.isDisposed ?? false,
        disposalDate: item.disposalDate,
      },
    });
  }

  console.log(SB);
  console.log('[seed] Seed complete.');
  console.log(SB);
  console.log(`Created ${sampleItems.length} sample items and ${reporters.length} users.`);

  for (const u of created) {
    if (u.email === adminSeed.email) {
      if (ADMIN_FORCE_PASSWORD) {
        console.log(`Admin login: ${u.email} / <SEED_ADMIN_PASSWORD env var>`);
      } else {
        console.log(`Admin login: ${u.email} / ${u.password}  <- newly created; SAVE THIS; it will not be shown again.`);
      }
    } else {
      console.log(`Sample user login: ${u.email} / ${u.password}  <- newly created; SAVE THIS; it will not be shown again.`);
    }
  }

  if (created.length === 0) {
    console.log('No new accounts created; existing seed accounts were left unchanged (passwords were NOT reset).');
  }
}

main()
  .catch((error) => {
    console.error('[seed] FAILED:', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });