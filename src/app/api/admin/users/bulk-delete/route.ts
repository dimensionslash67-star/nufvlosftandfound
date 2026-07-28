import { Prisma } from '@prisma/client';
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
  action: 'deleted' | 'deactivated';
  hardDeleted: boolean;
  isActive: boolean;
};

function normalizeUserIds(userIds: string[]) {
  return Array.from(new Set(userIds.map((id) => id.trim()).filter(Boolean)));
}

async function getUserRemovalCounts(userId: string) {
  const [reportedCount, claimedCount, auditLogCount, resetTokenCount] = await Promise.all([
    prisma.item.count({ where: { reporterId: userId } }),
    prisma.item.count({ where: { claimerId: userId } }),
    prisma.auditLog.count({ where: { userId } }),
    prisma.passwordResetToken.count({ where: { userId } }),
  ]);

  return {
    reportedCount,
    claimedCount,
    auditLogCount,
    resetTokenCount,
    total: reportedCount + claimedCount + auditLogCount + resetTokenCount,
  };
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
      { message: 'You cannot delete your own account.' },
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
    const removalCounts = await getUserRemovalCounts(user.id);
    const shouldHardDelete = removalCounts.total === 0;
    let hardDeleted = false;
    let action: BulkDeleteUserResult['action'] = 'deactivated';
    let responseUser = user;

    try {
      if (shouldHardDelete) {
        await prisma.user.delete({
          where: { id: user.id },
        });

        hardDeleted = true;
        action = 'deleted';
      } else {
        responseUser = await prisma.user.update({
          where: { id: user.id },
          data: { isActive: false },
          select: userSelect,
        });
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        responseUser = await prisma.user.update({
          where: { id: user.id },
          data: { isActive: false },
          select: userSelect,
        });
        hardDeleted = false;
        action = 'deactivated';
      } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        missingUserIds.push(user.id);
        continue;
      } else {
        console.error('[Admin Bulk User Delete] Error:', error);
        return NextResponse.json({ message: 'Failed to delete selected users.' }, { status: 500 });
      }
    }

    results.push({
      id: responseUser.id,
      username: responseUser.username,
      email: responseUser.email,
      action,
      hardDeleted,
      isActive: responseUser.isActive,
    });
  }

  await createAuditLog({
    userId: admin.userId,
    action: 'ADMIN_USERS_BULK_DELETED',
    entityType: 'USER',
    entityId: requestedUserIds.join(','),
    details: {
      requestedUserIds,
      missingUserIds,
      results,
      summary: {
        deleted: results.filter((result) => result.hardDeleted).length,
        deactivated: results.filter((result) => !result.hardDeleted).length,
      },
    },
    request,
  });

  return NextResponse.json({
    message: 'Selected users processed successfully.',
    results,
    missingUserIds,
    summary: {
      deleted: results.filter((result) => result.hardDeleted).length,
      deactivated: results.filter((result) => !result.hardDeleted).length,
    },
  });
}
