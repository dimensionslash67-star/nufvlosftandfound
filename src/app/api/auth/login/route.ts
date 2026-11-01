import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import {
  comparePassword,
  createJWT,
  getAuthCookieName,
  getAuthCookieOptions,
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  checkRateLimit,
  getClientIp,
  getRateLimitFailure,
  normalizeRateLimitKey,
} from '@/lib/rateLimit';
import { loginIdentifierSchema } from '@/lib/validations';

// Preserve the existing healthy Redis limit for IPs; fallback is stricter per instance.
const LOGIN_IP_LIMIT = 10;
const LOGIN_FALLBACK_LIMIT = 5;
// Five login attempts per 15 minutes per normalized account identifier.
const LOGIN_ACCOUNT_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipRateLimit = await checkRateLimit(`login:ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS, {
    failMode: 'fallback',
    fallbackLimit: LOGIN_FALLBACK_LIMIT,
  });
  const ipFailure = getRateLimitFailure(
    ipRateLimit,
    'Too many login attempts. Please try again later.',
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
    const parsed = loginIdentifierSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Validation failed.',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const identifier = parsed.data.email.trim();
    const normalizedEmail = normalizeRateLimitKey(identifier);
    const isEmailLogin = identifier.includes('@');

    const accountRateLimit = await checkRateLimit(
      `login:account:${normalizedEmail}`,
      LOGIN_ACCOUNT_LIMIT,
      LOGIN_WINDOW_MS,
      { failMode: 'fallback' },
    );
    const accountFailure = getRateLimitFailure(
      accountRateLimit,
      'Too many login attempts. Please try again later.',
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

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedEmail, mode: 'insensitive' } },
          { username: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: 'This account has been deactivated. Contact an administrator.' },
        { status: 403 },
      );
    }

    const passwordMatches = await comparePassword(parsed.data.password, user.password);

    if (!passwordMatches) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    const token = await createJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      tokenVersion: user.tokenVersion,
      rememberMe: parsed.data.rememberMe,
    });

    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      details: { loginType: isEmailLogin ? 'email' : 'username' },
      request,
    });

    const { password: _password, ...safeUser } = user;
    const response = NextResponse.json({
      message: 'Login successful.',
      user: safeUser,
      token,
    });

    response.cookies.set(getAuthCookieName(), token, getAuthCookieOptions(parsed.data.rememberMe));

    return response;
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json({ message: 'Login failed.' }, { status: 500 });
  }
}
