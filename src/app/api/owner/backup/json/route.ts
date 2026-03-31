import { getOwnerUser, requireOwnerPinAccess } from '@/lib/ownerGuard';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const guard = await requireOwnerPinAccess();

  if (guard) {
    return guard;
  }

  const owner = await getOwnerUser();

  if (!owner) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const [items, users, claims, auditLogs, settings] = await Promise.all([
    prisma.item.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.item.findMany({
      where: {
        claimedAt: { not: null },
      },
      orderBy: { claimedAt: 'desc' },
      select: {
        id: true,
        itemCode: true,
        itemName: true,
        category: true,
        location: true,
        status: true,
        reporterId: true,
        claimerId: true,
        claimedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.setting.findMany({
      orderBy: { key: 'asc' },
    }),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    exportedBy: owner.email,
    version: '1.0',
    data: {
      items,
      users,
      claims,
      auditLogs,
      settings,
    },
  };

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="nufv-backup-${Date.now()}.json"`,
    },
  });
}
