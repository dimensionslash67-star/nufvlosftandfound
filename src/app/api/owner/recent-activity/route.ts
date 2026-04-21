import { NextRequest, NextResponse } from 'next/server';
import { requireAdminConsolePayload } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const guard = await requireAdminConsolePayload(request);

  if (!guard) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
