import { NextResponse } from 'next/server';
import { requireOwnerPinAccess } from '@/lib/ownerGuard';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const guard = await requireOwnerPinAccess();

  if (guard) {
    return guard;
  }

  const recentLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      user: {
        select: {
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return NextResponse.json({
    logs: recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      createdAt: log.createdAt,
      user: log.user,
    })),
  });
}
