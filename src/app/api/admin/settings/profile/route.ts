import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';
import {
  createJWT,
  getAuthCookieName,
  getAuthCookieOptions,
  getAuthPayloadFromRequest,
} from '@/lib/auth';
import { requireAdminPayload } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Display name must be at least 2 characters.'),
  email: z.string().trim().email('Please enter a valid email address.'),
});

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? displayName.trim(),
    lastName: parts.slice(1).join(' ') || null,
  };
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminPayload(request);
    const existingPayload = await getAuthPayloadFromRequest(request);

    if (!admin) {
      return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    const json = await request.json();
    const parsed = profileSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Validation failed.' },
        { status: 400 },
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        id: {
          not: admin.userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Email address is already in use.' }, { status: 409 });
    }

    const { firstName, lastName } = splitDisplayName(parsed.data.displayName);
    const user = await prisma.user.update({
      where: {
        id: admin.userId,
      },
      data: {
        email: normalizedEmail,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    await createAuditLog({
      userId: admin.userId,
      action: 'PROFILE_UPDATED',
      entityType: 'USER',
      entityId: admin.userId,
      details: {
        email: user.email,
        firstName,
        lastName,
      },
      request,
    });

    const token = await createJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      rememberMe: existingPayload?.rememberMe,
    });

    const response = NextResponse.json({ message: 'Profile updated successfully.' });
    response.cookies.set(
      getAuthCookieName(),
      token,
      getAuthCookieOptions(existingPayload?.rememberMe),
    );
    return response;
  } catch (error) {
    console.error('Profile settings update error:', error);
    return NextResponse.json({ message: 'Unable to update profile.' }, { status: 500 });
  }
}
