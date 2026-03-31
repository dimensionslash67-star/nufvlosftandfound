import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAuthCookieName, getExpiredAuthCookieOptions, verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getAuthCookieName())?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = await verifyJWT(token);

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
