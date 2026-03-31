import { getOwnerUser, requireOwnerPinAccess } from '@/lib/ownerGuard';
import { prisma } from '@/lib/prisma';

function escapeCsvValue(value: unknown) {
  const stringValue = value instanceof Date ? value.toISOString() : String(value ?? '');
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export async function POST(request: Request) {
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

  const dataset =
    new URL(request.url).searchParams.get('dataset') === 'users' ? 'users' : 'items';

  if (dataset === 'users') {
    const users = await prisma.user.findMany({
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
      },
    });

    const csv = [
      ['ID', 'Email', 'Username', 'First Name', 'Last Name', 'Role', 'Active', 'Created At']
        .map(escapeCsvValue)
        .join(','),
      ...users.map((user) =>
        [
          user.id,
          user.email,
          user.username,
          user.firstName ?? '',
          user.lastName ?? '',
          user.role,
          user.isActive ? 'true' : 'false',
          user.createdAt.toISOString(),
        ]
          .map(escapeCsvValue)
          .join(','),
      ),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="nufv-users-${Date.now()}.csv"`,
      },
    });
  }

  const items = await prisma.item.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      itemCode: true,
      itemName: true,
      category: true,
      description: true,
      location: true,
      status: true,
      dateReported: true,
      claimedAt: true,
      dueDate: true,
      contactInfo: true,
      createdAt: true,
    },
  });

  const csv = [
    [
      'Item Code',
      'Item Name',
      'Category',
      'Description',
      'Location',
      'Status',
      'Date Reported',
      'Claimed At',
      'Due Date',
      'Contact Info',
      'Created At',
    ]
      .map(escapeCsvValue)
      .join(','),
    ...items.map((item) =>
      [
        item.itemCode ?? '',
        item.itemName,
        item.category,
        item.description ?? '',
        item.location,
        item.status,
        item.dateReported.toISOString(),
        item.claimedAt?.toISOString() ?? '',
        item.dueDate?.toISOString() ?? '',
        item.contactInfo ?? '',
        item.createdAt.toISOString(),
      ]
        .map(escapeCsvValue)
        .join(','),
    ),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="nufv-items-${Date.now()}.csv"`,
    },
  });
}
