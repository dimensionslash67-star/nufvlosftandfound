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

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: identifier }],
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

    if (!user || !user.isActive) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    const passwordMatches = await comparePassword(parsed.data.password, user.password);

    if (!passwordMatches) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    const token = await createJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
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

    response.cookies.set(getAuthCookieName(), token, getAuthCookieOptions());

    return response;
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json({ message: 'Login failed.' }, { status: 500 });
  }
}

