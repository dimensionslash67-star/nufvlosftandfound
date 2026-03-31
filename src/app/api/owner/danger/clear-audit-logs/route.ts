import { subDays } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { getOwnerUser, requireOwnerPinAccess } from '@/lib/ownerGuard';
import { prisma } from '@/lib/prisma';

function getCutoffDate() {
  return subDays(new Date(), 90);
}

export async function GET() {
  const guard = await requireOwnerPinAccess();

  if (guard) {
    return guard;
  }

  const cutoff = getCutoffDate();
  const count = await prisma.auditLog.count({
    where: {
      createdAt: {
        lt: cutoff,
      },
    },
  });

  return NextResponse.json({
    count,
    cutoff,
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireOwnerPinAccess();

  if (guard) {
    return guard;
  }

  const owner = await getOwnerUser();

  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const cutoff = getCutoffDate();
  const count = await prisma.auditLog.count({
    where: {
      createdAt: {
        lt: cutoff,
      },
    },
  });

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoff,
      },
    },
  });

  await createAuditLog({
    userId: owner.id,
    action: 'OWNER_CLEARED_OLD_AUDIT_LOGS',
    entityType: 'OWNER',
    entityId: owner.id,
    details: {
      cutoff: cutoff.toISOString(),
      requestedCount: count,
      deletedCount: result.count,
    },
    request,
  });

  return NextResponse.json({
    message: `Deleted ${result.count} audit log(s) older than 90 days.`,
    count: result.count,
    cutoff,
  });
}
