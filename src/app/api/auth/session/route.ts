import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookieName, getExpiredAuthCookieOptions, verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(getAuthCookieName())?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload?.userId) {
      const response = NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
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
      const response = NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
      response.cookies.set(getAuthCookieName(), '', getExpiredAuthCookieOptions());
      return response;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session error:', error);

    return NextResponse.json({ message: 'Unable to fetch session.' }, { status: 500 });
  }
}

