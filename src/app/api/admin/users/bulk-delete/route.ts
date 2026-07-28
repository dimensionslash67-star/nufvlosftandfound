import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { requireAdminPayload } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { adminBulkDeleteUsersSchema } from '@/lib/validations';

const userSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

type BulkDeleteUserResult = {
  id: string;
  username: string;
  email: string;
  action: 'deactivated';
  isActive: boolean;
};

function normalizeUserIds(userIds: string[]) {
  return Array.from(new Set(userIds.map((id) => id.trim()).filter(Boolean)));
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const parsed = adminBulkDeleteUsersSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const requestedUserIds = normalizeUserIds(parsed.data.userIds);

  if (requestedUserIds.length === 0) {
    return NextResponse.json({ message: 'At least one user must be selected.' }, { status: 400 });
  }

  if (requestedUserIds.includes(admin.userId)) {
    return NextResponse.json(
      { message: 'You cannot deactivate your own account.' },
      { status: 400 },
    );
  }

  const existingUsers = await prisma.user.findMany({
    where: {
      id: { in: requestedUserIds },
    },
    select: userSelect,
  });

  if (existingUsers.length === 0) {
    return NextResponse.json({ message: 'No selected users were found.' }, { status: 404 });
  }

  const existingIds = new Set(existingUsers.map((user) => user.id));
  const missingUserIds = requestedUserIds.filter((id) => !existingIds.has(id));
  const results: BulkDeleteUserResult[] = [];

  for (const user of existingUsers) {
    try {
      const responseUser = await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
        select: userSelect,
      });

      results.push({
        id: responseUser.id,
        username: responseUser.username,
        email: responseUser.email,
        action: 'deactivated',
        isActive: responseUser.isActive,
      });
    } catch (error) {
      console.error('[Admin Bulk User Deactivate] Error:', error);
      return NextResponse.json({ message: 'Failed to deactivate selected users.' }, { status: 500 });
    }
  }

  await createAuditLog({
    userId: admin.userId,
    action: 'ADMIN_USERS_DEACTIVATED',
    entityType: 'USER',
    entityId: requestedUserIds.join(','),
    details: {
      requestedUserIds,
      missingUserIds,
      results,
      summary: {
        deactivated: results.length,
      },
    },
    request,
  });

  return NextResponse.json({
    message: 'Selected users deactivated successfully.',
    results,
    missingUserIds,
    summary: {
      deactivated: results.length,
    },
  });
}
