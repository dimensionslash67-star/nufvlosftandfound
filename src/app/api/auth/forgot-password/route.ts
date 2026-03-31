import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePasswordResetEmail, getAppUrl, sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('A valid email address is required.'),
});

const GENERIC_MESSAGE =
  'If an account exists with this email, a reset link has been sent.';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = forgotPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid email address.' },
        { status: 400 },
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, isActive: true },
    });

    if (!user?.isActive) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const resetLink = `${getAppUrl()}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - NUFV Lost & Found',
      html: generatePasswordResetEmail(resetLink),
    });

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
