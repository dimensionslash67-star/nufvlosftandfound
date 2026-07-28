import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';
import { requireAdminPayload } from '@/lib/admin';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const parsed = resetPasswordSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Validation failed.' },
      { status: 400 },
    );
  }

  const { id } = await params;

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      isActive: true,
    },
  });

  if (!targetUser) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  try {
    const passwordHash = await hashPassword(parsed.data.newPassword);

    await prisma.user.update({
      where: { id },
      data: {
        password: passwordHash,
      },
    });

    await createAuditLog({
      userId: admin.userId,
      action: 'ADMIN_USER_PASSWORD_RESET',
      entityType: 'USER',
      entityId: id,
      details: {
        targetUsername: targetUser.username,
        targetEmail: targetUser.email,
        targetIsActive: targetUser.isActive,
        resetBy: admin.username,
      },
      request,
    });

    return NextResponse.json({ message: 'Temporary password updated successfully.' });
  } catch (error) {
    console.error('[Admin Reset Password] Error:', error);
    return NextResponse.json({ message: 'Failed to reset password.' }, { status: 500 });
  }
}
