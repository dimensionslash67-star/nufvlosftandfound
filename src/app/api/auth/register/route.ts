import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { createJWT, getAuthCookieName, getAuthCookieOptions, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = registerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Validation failed.',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const username = parsed.data.username.trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'An account with that email or username already exists.' },
        { status: 409 },
      );
    }

    const password = await hashPassword(parsed.data.password);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password,
        firstName: normalizeOptionalString(parsed.data.firstName),
        lastName: normalizeOptionalString(parsed.data.lastName),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, username: user.username },
      request,
    });

    const token = await createJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message: 'Registration successful.',
        user,
        token,
      },
      { status: 201 },
    );

    response.cookies.set(getAuthCookieName(), token, getAuthCookieOptions());

    return response;
  } catch (error) {
    console.error('Register error:', error);

    return NextResponse.json({ message: 'Registration failed.' }, { status: 500 });
  }
}

