import { NextResponse } from 'next/server';
import { getAuthCookieName, getCurrentUser, getExpiredAuthCookieOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const payload = await getCurrentUser();

    if (!payload?.userId) {
      const response = NextResponse.json({ user: null }, { status: 401 });
      response.cookies.set(getAuthCookieName(), '', getExpiredAuthCookieOptions());
      return response;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    if (!user || !user.isActive) {
      const response = NextResponse.json({ user: null }, { status: 401 });
      response.cookies.set(getAuthCookieName(), '', getExpiredAuthCookieOptions());
      return response;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
