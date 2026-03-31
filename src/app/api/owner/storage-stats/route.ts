import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwnerPinAccess } from '@/lib/ownerGuard';

type DatabaseSizeRow = {
  size: string;
  size_bytes: bigint | number;
};

type TableSizeRow = {
  table_name: string;
  total_size: string;
  size_bytes: bigint | number;
  row_count: bigint | number;
};

const NEON_FREE_TIER_LIMIT_BYTES = 512 * 1024 * 1024;

export async function GET() {
  const guard = await requireOwnerPinAccess();

  if (guard) {
    return guard;
  }

  const [dbSizeRows, tableSizeRows] = await Promise.all([
    prisma.$queryRaw<DatabaseSizeRow[]>`
      SELECT
        pg_size_pretty(pg_database_size(current_database())) AS size,
        pg_database_size(current_database()) AS size_bytes
    `,
    prisma.$queryRaw<TableSizeRow[]>`
      SELECT
        relname AS table_name,
        pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
        pg_total_relation_size(relid) AS size_bytes,
        COALESCE(n_live_tup, 0)::bigint AS row_count
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
    `,
  ]);

  const sizeRow = dbSizeRows[0];
  const sizeBytes = Number(sizeRow?.size_bytes ?? 0);
  const percentUsed = Math.min(100, Number(((sizeBytes / NEON_FREE_TIER_LIMIT_BYTES) * 100).toFixed(2)));

  return NextResponse.json({
    totalSize: sizeRow?.size ?? '0 bytes',
    sizeBytes,
    limitBytes: NEON_FREE_TIER_LIMIT_BYTES,
    percentUsed,
    warning: percentUsed >= 80,
    tables: tableSizeRows.map((row) => ({
      tableName: row.table_name,
      totalSize: row.total_size,
      sizeBytes: Number(row.size_bytes ?? 0),
      rowCount: Number(row.row_count ?? 0),
    })),
  });
}
