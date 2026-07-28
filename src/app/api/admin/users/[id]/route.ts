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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

  const { id } = await params;

  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!existingUser) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const normalizedUsername = parsed.data.username.trim();

  const duplicateUser = await prisma.user.findFirst({
    where: {
      id: { not: id },
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
      where: { id },
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
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const { id } = await params;

  if (admin.userId === id) {
    return NextResponse.json(
      { message: 'You cannot deactivate your own account.' },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!existingUser) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userSelect,
    });

    const alreadyInactive = !existingUser.isActive;

    await createAuditLog({
      userId: admin.userId,
      action: 'ADMIN_USER_DEACTIVATED',
      entityType: 'USER',
      entityId: id,
      details: {
        before: existingUser,
        after: updatedUser,
        alreadyInactive,
        deactivatedBy: admin.username,
      },
      request,
    });

    return NextResponse.json({
      message: alreadyInactive ? 'User is already deactivated.' : 'User deactivated successfully.',
      user: updatedUser,
      deleted: false,
      deactivated: true,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    console.error('[Admin User Deactivate] Error:', error);
    return NextResponse.json({ message: 'Failed to deactivate user.' }, { status: 500 });
  }
}
