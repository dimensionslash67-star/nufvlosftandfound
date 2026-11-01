import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import {
  getAuthCookieName,
  getExpiredAuthCookieOptions,
  getAuthenticatedUserFromToken,
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getAuthCookieName())?.value;
  const currentUser = token ? await getAuthenticatedUserFromToken(token) : null;

  if (currentUser) {
    try {
      const result = await prisma.user.updateMany({
        where: {
          id: currentUser.id,
          isActive: true,
          tokenVersion: currentUser.tokenVersion,
        },
        data: { tokenVersion: { increment: 1 } },
      });

      if (result.count !== 1) {
        return clearLogoutCookies(request);
      }
    } catch {
      console.error('Logout token revocation failed.');
      return clearLogoutCookies(request);
    }

    await createAuditLog({
      userId: currentUser.id,
      action: 'USER_LOGOUT',
      entityType: 'AUTH',
      entityId: currentUser.id,
      request,
    }).catch(() => {
      console.error('Logout audit failed.');
    });
  }

  return clearLogoutCookies(request);
}

function clearLogoutCookies(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.set(getAuthCookieName(), '', getExpiredAuthCookieOptions());

  return response;
}
