import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';
import { invalidateResetTokens } from '@/lib/passwordReset';
import { prisma } from '@/lib/prisma';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required.'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = resetPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid password reset request.' },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(parsed.data.newPassword);

    const resetSucceeded = await prisma.$transaction(async (tx) => {
      const resetToken = await tx.passwordResetToken.findUnique({
        where: { token: parsed.data.token },
        select: { userId: true },
      });

      if (!resetToken) {
        return false;
      }

      const user = await tx.user.findUnique({
        where: { id: resetToken.userId },
        select: { id: true, isActive: true },
      });

      if (!user?.isActive) {
        return false;
      }

      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          token: parsed.data.token,
          used: false,
          expiresAt: { gt: new Date() },
        },
        data: { used: true },
      });

      if (consumed.count !== 1) {
        return false;
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          tokenVersion: { increment: 1 },
        },
      });
      await invalidateResetTokens(user.id, tx);

      return true;
    });

    if (!resetSucceeded) {
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
