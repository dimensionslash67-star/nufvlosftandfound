import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthCookieName, verifyJWT } from '@/lib/auth';

const publicAuthRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicAuthRoute = publicAuthRoutes.includes(pathname);

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

  return NextResponse.next();
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
