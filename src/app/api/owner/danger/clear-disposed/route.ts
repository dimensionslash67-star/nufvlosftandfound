import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { getOwnerUser, requireOwnerPinAccess } from '@/lib/ownerGuard';
import { prisma } from '@/lib/prisma';

const disposedWhere = {
  OR: [{ status: 'DISPOSED' as const }, { isDisposed: true }],
};

export async function GET() {
  const guard = await requireOwnerPinAccess();

  if (guard) {
    return guard;
  }

  const count = await prisma.item.count({ where: disposedWhere });
  return NextResponse.json({ count });
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

  const count = await prisma.item.count({ where: disposedWhere });
  const result = await prisma.item.deleteMany({ where: disposedWhere });

  await createAuditLog({
    userId: owner.id,
    action: 'OWNER_CLEARED_DISPOSED_ITEMS',
    entityType: 'OWNER',
    entityId: owner.id,
    details: {
      requestedCount: count,
      deletedCount: result.count,
    },
    request,
  });

  return NextResponse.json({
    message: `Deleted ${result.count} disposed item(s).`,
    count: result.count,
  });
}
