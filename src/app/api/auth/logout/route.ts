import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import {
  getAuthCookieName,
  getExpiredAuthCookieOptions,
  verifyJWT,
} from '@/lib/auth';
import {
  getExpiredOwnerPinCookieOptions,
  getOwnerPinCookieName,
} from '@/lib/ownerGuard';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getAuthCookieName())?.value;
  const payload = token ? await verifyJWT(token) : null;

  if (payload?.userId) {
    await createAuditLog({
      userId: payload.userId,
      action: 'USER_LOGOUT',
      entityType: 'AUTH',
      entityId: payload.userId,
      request,
    }).catch((error) => {
      console.error('Logout audit error:', error);
    });
  }

  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.set(getAuthCookieName(), '', getExpiredAuthCookieOptions());
  response.cookies.set(getOwnerPinCookieName(), '', getExpiredOwnerPinCookieOptions());

  return response;
}
