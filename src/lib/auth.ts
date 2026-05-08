import bcrypt from 'bcryptjs';
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { prisma } from './prisma';

export type AuthJWTPayload = JWTPayload & {
  userId: string;
  email: string;
  role: string;
  username: string;
  rememberMe?: boolean;
};

export type OwnerPinJWTPayload = JWTPayload & {
  scope: 'owner-pin';
  userId: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const AUTH_COOKIE_NAME = 'auth-token';
const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;
const AUTH_TOKEN_MAX_AGE_REMEMBER_ME = 60 * 60 * 24 * 90;
const authUserSelect = {
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

function getJWTSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return new TextEncoder().encode(secret);
}

export function getAuthCookieName() {
  return AUTH_COOKIE_NAME;
}

export function getAuthCookieOptions(rememberMe = false) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: rememberMe ? AUTH_TOKEN_MAX_AGE_REMEMBER_ME : AUTH_TOKEN_MAX_AGE,
  };
}

export function getExpiredAuthCookieOptions() {
  return {
    ...getAuthCookieOptions(),
    maxAge: 0,
  };
}

function readCookieValue(cookieHeader: string | null, cookieName: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookiePrefix = `${cookieName}=`;
  const matchingCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookiePrefix));

  if (!matchingCookie) {
    return null;
  }

  return decodeURIComponent(matchingCookie.slice(cookiePrefix.length));
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createJWT(payload: {
  userId: string;
  email: string;
  role: string;
  username: string;
  rememberMe?: boolean;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    username: payload.username,
    rememberMe: Boolean(payload.rememberMe),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(payload.rememberMe ? '90d' : '30d')
    .sign(getJWTSecret());
}

export async function createOwnerPinJWT(userId: string): Promise<string> {
  return new SignJWT({
    scope: 'owner-pin',
    userId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('4h')
    .sign(getJWTSecret());
}

export async function verifyJWT(token: string): Promise<AuthJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret());
    const verifiedPayload = payload as Partial<AuthJWTPayload>;

    if (
      !verifiedPayload.userId ||
      !verifiedPayload.email ||
      !verifiedPayload.role ||
      !verifiedPayload.username
    ) {
      console.error('JWT payload missing required fields:', verifiedPayload);
      return null;
    }

    return verifiedPayload as AuthJWTPayload;
  } catch (error) {
    if (
      !(error instanceof Error && 'code' in error && error.code === 'ERR_JWT_EXPIRED')
    ) {
      console.error('JWT verification failed:', error);
    }

    return null;
  }
}

export async function verifyOwnerPinJWT(token: string): Promise<OwnerPinJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret());
    const verifiedPayload = payload as Partial<OwnerPinJWTPayload>;

    if (verifiedPayload.scope !== 'owner-pin' || !verifiedPayload.userId) {
      return null;
    }

    return verifiedPayload as OwnerPinJWTPayload;
  } catch (error) {
    console.error('Owner PIN JWT verification failed:', error);
    return null;
  }
}

export async function getAuthPayloadFromRequest(request: NextRequest) {
  const headerUserId = request.headers.get('x-user-id');
  const headerEmail = request.headers.get('x-user-email');
  const headerRole = request.headers.get('x-user-role');
  const headerUsername = request.headers.get('x-user-username');

  if (headerUserId && headerEmail && headerRole && headerUsername) {
    return {
      userId: headerUserId,
      email: headerEmail,
      role: headerRole,
      username: headerUsername,
    } as AuthJWTPayload;
  }

  const cookieName = getAuthCookieName();
  let token = request.cookies.get(cookieName)?.value;

  if (!token) {
    token = readCookieValue(request.headers.get('cookie'), cookieName) ?? undefined;
  }

  if (!token) {
    const authorization = request.headers.get('authorization');

    if (authorization?.startsWith('Bearer ')) {
      token = authorization.slice('Bearer '.length).trim();
    }
  }

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(cookieName)?.value;
  }

  if (!token) {
    return null;
  }

  return verifyJWT(token);
}

export async function getCurrentUserPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAuthCookieName())?.value;

  if (!token) {
    return null;
  }

  return verifyJWT(token);
}

async function getAuthenticatedUserById(userId: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: authUserSelect,
  });

  if (!user?.isActive) {
    return null;
  }

  return user;
}

export async function getCurrentUser() {
  const requestHeaders = await headers();
  const headerUserId = requestHeaders.get('x-user-id');

  if (headerUserId) {
    const headerUser = await getAuthenticatedUserById(headerUserId);

    if (headerUser) {
      return headerUser;
    }
  }

  const payload = await getCurrentUserPayload();

  if (!payload?.userId) {
    return null;
  }

  return getAuthenticatedUserById(payload.userId);
}

export async function getAuthenticatedUserFromRequest(request: NextRequest) {
  const payload = await getAuthPayloadFromRequest(request);

  if (!payload?.userId) {
    return null;
  }

  return getAuthenticatedUserById(payload.userId);
}
