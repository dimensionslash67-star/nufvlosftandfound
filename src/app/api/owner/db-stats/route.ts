import { NextRequest, NextResponse } from 'next/server';
import { requireAdminConsolePayload } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const guard = await requireAdminConsolePayload(request);

  if (!guard) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
