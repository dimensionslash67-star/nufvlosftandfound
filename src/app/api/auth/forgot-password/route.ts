import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePasswordResetEmail, getAppUrl, sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import {
  checkRateLimit,
  getClientIp,
  getRateLimitFailure,
  normalizeRateLimitKey,
} from '@/lib/rateLimit';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('A valid email address is required.'),
});

const GENERIC_MESSAGE =
  'If an account exists with this email, a reset link has been sent.';

// 5 password-reset requests per 60 minutes per IP
const FORGOT_LIMIT = 5;
const FORGOT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipRateLimit = await checkRateLimit(`forgot:ip:${ip}`, FORGOT_LIMIT, FORGOT_WINDOW_MS, {
    failMode: 'closed',
  });
  const ipFailure = getRateLimitFailure(
    ipRateLimit,
    'Too many password reset requests. Please try again later.',
  );

  if (ipFailure) {
    return NextResponse.json(
      { message: ipFailure.message },
      {
        status: ipFailure.status,
        headers: { 'Retry-After': String(ipFailure.retryAfter) },
      },
    );
  }

  try {
    const json = await request.json();
    const parsed = forgotPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid email address.' },
        { status: 400 },
      );
    }

    const normalizedEmail = normalizeRateLimitKey(parsed.data.email);
    const accountRateLimit = await checkRateLimit(
      `forgot:account:${normalizedEmail}`,
      FORGOT_LIMIT,
      FORGOT_WINDOW_MS,
      { failMode: 'closed' },
    );
    const accountFailure = getRateLimitFailure(
      accountRateLimit,
      'Too many password reset requests. Please try again later.',
    );

    if (accountFailure) {
      return NextResponse.json(
        { message: accountFailure.message },
        {
          status: accountFailure.status,
          headers: { 'Retry-After': String(accountFailure.retryAfter) },
        },
      );
    }

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
