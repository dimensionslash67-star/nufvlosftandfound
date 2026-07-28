import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import {
  comparePassword,
  createJWT,
  getAuthCookieName,
  getAuthCookieOptions,
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { loginIdentifierSchema } from '@/lib/validations';

export async function POST(request: Request) {
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
    const normalizedEmail = identifier.toLowerCase();
    const isEmailLogin = identifier.includes('@');

    console.info('[LOGIN] attempt received', {
      identifier,
      type: isEmailLogin ? 'email' : 'username',
      rememberMe: parsed.data.rememberMe,
    });

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
        createdAt: true,
        updatedAt: true,
      },
    });

    console.info('[LOGIN] user lookup result', user
      ? {
          id: user.id,
          email: user.email,
          username: user.username,
          isActive: user.isActive,
          role: user.role,
        }
      : null);

    if (!user) {
      console.info('[LOGIN] rejected: no matching user');
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    if (!user.isActive) {
      console.info('[LOGIN] rejected: account inactive');
      return NextResponse.json(
        { message: 'This account has been deactivated. Contact an administrator.' },
        { status: 403 },
      );
    }

    const passwordMatches = await comparePassword(parsed.data.password, user.password);
    console.info('[LOGIN] password match result', {
      userId: user.id,
      passwordMatches,
    });

    if (!passwordMatches) {
      console.info('[LOGIN] rejected: password mismatch');
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    const token = await createJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      rememberMe: parsed.data.rememberMe,
    });

    console.info('[LOGIN] success', {
      userId: user.id,
      email: user.email,
      rememberMe: parsed.data.rememberMe,
    });

    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      details: { identifier },
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
