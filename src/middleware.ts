import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'auth-token';

type AuthPayload = {
  userId?: string;
  email?: string;
  role?: string;
  username?: string;
};

function getJWTSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return null;
  }

  return new TextEncoder().encode(secret);
}

async function verifyAuthToken(token: string): Promise<AuthPayload | null> {
  const secret = getJWTSecret();

  if (!secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const verifiedPayload = payload as AuthPayload;

    if (
      !verifiedPayload.userId ||
      !verifiedPayload.email ||
      !verifiedPayload.role ||
      !verifiedPayload.username
    ) {
      return null;
    }

    return verifiedPayload;
  } catch {
    return null;
  }
}

async function hasActiveAccount(request: NextRequest) {
  try {
    const response = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
        'x-middleware-auth-check': '1',
      },
      cache: 'no-store',
    });

    return response.ok;
  } catch {
    return false;
  }
}

function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL('/login', request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (!token) {
    return isAuthPage ? NextResponse.next() : redirectToLogin(request);
  }

  const payload = await verifyAuthToken(token);

  if (!payload || !(await hasActiveAccount(request))) {
    return isAuthPage ? NextResponse.next() : redirectToLogin(request);
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/items/:path*',
    '/search/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};
