import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';
import { comparePassword, hashPassword } from '@/lib/auth';
import { requireAdminPayload } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'New password and confirmation do not match.',
    path: ['confirmPassword'],
  });

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminPayload(request);

    if (!admin) {
      return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    const json = await request.json();
    const parsed = passwordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Validation failed.' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: admin.userId,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const matches = await comparePassword(parsed.data.currentPassword, user.password);
    if (!matches) {
      return NextResponse.json({ message: 'Current password is incorrect.' }, { status: 400 });
    }

    await prisma.user.update({
      where: {
        id: admin.userId,
      },
      data: {
        password: await hashPassword(parsed.data.newPassword),
      },
    });

    await createAuditLog({
      userId: admin.userId,
      action: 'USER_PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: admin.userId,
      request,
    });

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password settings update error:', error);
    return NextResponse.json({ message: 'Unable to update password.' }, { status: 500 });
  }
}
