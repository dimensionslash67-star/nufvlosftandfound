import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthCookieName, verifyJWT } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/items', '/search', '/admin', '/owner', '/settings'];
const publicAuthRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicAuthRoute = publicAuthRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  const token = request.cookies.get(getAuthCookieName())?.value;

  if (isPublicAuthRoute) {
    if (!token) {
      return NextResponse.next();
    }

    const payload = await verifyJWT(token);

    if (!payload?.userId) {
      const response = NextResponse.next();
      response.cookies.delete(getAuthCookieName());
      return response;
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
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

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('session_expired', 'true');
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(getAuthCookieName());
    return response;
  }
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/items/:path*',
    '/search/:path*',
    '/admin/:path*',
    '/owner/:path*',
    '/settings/:path*',
  ],
};
