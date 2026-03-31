import { NextRequest, NextResponse } from 'next/server';
import { getExpiredOwnerPinCookieOptions, getOwnerPinCookieName } from '@/lib/ownerGuard';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  response.cookies.set(getOwnerPinCookieName(), '', getExpiredOwnerPinCookieOptions());
  return response;
}
