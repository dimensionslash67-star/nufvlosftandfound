import bcrypt from 'bcryptjs';
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
import type { NextRequest } from 'next/server';

export type AuthJWTPayload = JWTPayload & {
  userId: string;
  email: string;
  role: string;
  username: string;
};

export type OwnerPinJWTPayload = JWTPayload & {
  scope: 'owner-pin';
  userId: string;
};

const AUTH_COOKIE_NAME = 'auth-token';
const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

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

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_TOKEN_MAX_AGE,
  };
}

export function getExpiredAuthCookieOptions() {
  return {
    ...getAuthCookieOptions(),
    maxAge: 0,
  };
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
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    username: payload.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime('7d')
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
    console.error('JWT verification failed:', error);
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
  const token = request.cookies.get(getAuthCookieName())?.value;

  if (!token) {
    return null;
  }

  return verifyJWT(token);
}
