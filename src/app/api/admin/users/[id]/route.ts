import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { requireAdminPayload } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { adminUserEditSchema } from '@/lib/validations';

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

function normalizeOptionalString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const parsed = adminUserEditSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: params.id },
    select: userSelect,
  });

  if (!existingUser) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const normalizedUsername = parsed.data.username.trim();

  const duplicateUser = await prisma.user.findFirst({
    where: {
      id: { not: params.id },
      OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
    },
    select: { id: true },
  });

  if (duplicateUser) {
    return NextResponse.json(
      { message: 'Email or username already exists.' },
      { status: 409 },
    );
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        firstName: normalizeOptionalString(parsed.data.firstName),
        lastName: normalizeOptionalString(parsed.data.lastName),
        email: normalizedEmail,
        username: normalizedUsername,
        role: parsed.data.role,
        isActive: parsed.data.isActive,
      },
      select: userSelect,
    });

    await createAuditLog({
      userId: admin.userId,
      action: 'ADMIN_USER_UPDATED',
      entityType: 'USER',
      entityId: updatedUser.id,
      details: {
        before: existingUser,
        after: updatedUser,
      },
      request,
    });

    return NextResponse.json({ message: 'User updated successfully.', user: updatedUser });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: 'Email or username already exists.' },
          { status: 409 },
        );
      }

      if (error.code === 'P2025') {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
      }
    }

    console.error('[Admin User Update] Error:', error);
    return NextResponse.json({ message: 'Failed to update user.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  if (admin.userId === params.id) {
    return NextResponse.json(
      { message: 'You cannot delete your own account.' },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: params.id },
    select: userSelect,
  });

  if (!existingUser) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  const removalCounts = await getUserRemovalCounts(params.id);
  const canHardDelete = removalCounts.total === 0;
  let action: 'ADMIN_USER_DELETED' | 'ADMIN_USER_DEACTIVATED' = 'ADMIN_USER_DEACTIVATED';
  let responseUser = existingUser;
  let hardDeleted = false;

  try {
    if (canHardDelete) {
      await prisma.user.delete({
        where: { id: params.id },
      });

      action = 'ADMIN_USER_DELETED';
      hardDeleted = true;
    } else {
      responseUser = await prisma.user.update({
        where: { id: params.id },
        data: { isActive: false },
        select: userSelect,
      });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      responseUser = await prisma.user.update({
        where: { id: params.id },
        data: { isActive: false },
        select: userSelect,
      });
      action = 'ADMIN_USER_DEACTIVATED';
      hardDeleted = false;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    } else {
      console.error('[Admin User Delete] Error:', error);
      return NextResponse.json({ message: 'Failed to delete user.' }, { status: 500 });
    }
  }

  await createAuditLog({
    userId: admin.userId,
    action,
    entityType: 'USER',
    entityId: params.id,
    details: {
      user: existingUser,
      removalCounts,
      hardDeleted,
      mode: hardDeleted ? 'deleted' : 'deactivated',
    },
    request,
  });

  return NextResponse.json({
    message: hardDeleted ? 'User deleted successfully.' : 'User deactivated successfully.',
    user: responseUser,
    deleted: hardDeleted,
    deactivated: !hardDeleted,
  });
}
