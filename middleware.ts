import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthCookieName, verifyJWT } from '@/lib/auth';

const OWNER_EMAIL = 'aureojoseph518@gmail.com';
const protectedRoutes = ['/dashboard', '/items', '/search', '/admin', '/owner'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getAuthCookieName())?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyJWT(token);

    if (!payload?.userId || !payload.email || !payload.role || !payload.username) {
      console.error('Invalid token payload:', payload);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(getAuthCookieName());
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-username', payload.username);

    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname.startsWith('/owner') && payload.email !== OWNER_EMAIL) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(getAuthCookieName());
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/items/:path*', '/search/:path*', '/admin/:path*', '/owner/:path*'],
};
