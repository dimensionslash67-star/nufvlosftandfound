import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwnerPinAccess } from '@/lib/ownerGuard';

export async function GET() {
  const guard = await requireOwnerPinAccess();

  if (guard) {
    return guard;
  }

  const [
    totalItems,
    totalUsers,
    totalClaims,
    totalAuditLogs,
    available,
    claimed,
    disposed,
    lastItem,
    lastUser,
  ] = await Promise.all([
    prisma.item.count(),
    prisma.user.count(),
    prisma.item.count({ where: { claimedAt: { not: null } } }),
    prisma.auditLog.count(),
    prisma.item.count({ where: { status: 'PENDING' } }),
    prisma.item.count({ where: { status: 'CLAIMED' } }),
    prisma.item.count({ where: { status: 'DISPOSED' } }),
    prisma.item.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        itemCode: true,
        createdAt: true,
      },
    }),
    prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    totalItems,
    totalUsers,
    totalClaims,
    totalAuditLogs,
    available,
    claimed,
    disposed,
    lastItem,
    lastUser,
  });
}
