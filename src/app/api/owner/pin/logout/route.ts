import { NextRequest, NextResponse } from 'next/server';
import {
  getExpiredOwnerPinCookieOptions,
  getOwnerPinCookieName,
  incrementOwnerPinSessionVersion,
} from '@/lib/ownerGuard';

export async function GET(request: NextRequest) {
  let revoked = true;

  try {
    await incrementOwnerPinSessionVersion();
  } catch (error) {
    revoked = false;
    console.error('[ownerPinLogout] Failed to revoke owner PIN session.', error);
  }

  const response = revoked
    ? NextResponse.redirect(new URL('/dashboard', request.url))
    : NextResponse.json({ message: 'Unable to log out of the Owner Console.' }, { status: 503 });
  response.cookies.set(getOwnerPinCookieName(), '', getExpiredOwnerPinCookieOptions());
  return response;
}
