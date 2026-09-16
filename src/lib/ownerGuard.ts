import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  comparePassword,
  createOwnerPinJWT,
  getAuthCookieName,
  hashPassword,
  verifyJWT,
  verifyOwnerPinJWT,
} from './auth';
import {
  OWNER_EMAIL_SETTING_KEY,
  OWNER_PIN_COOKIE_NAME,
  OWNER_PIN_MAX_AGE,
  OWNER_PIN_SETTING_KEY,
  normalizeEmail,
} from './owner';
import { prisma } from './prisma';

export function getOwnerPinCookieName() {
  return OWNER_PIN_COOKIE_NAME;
}

export function getOwnerPinCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: OWNER_PIN_MAX_AGE,
  };
}

export function getExpiredOwnerPinCookieOptions() {
  return {
    ...getOwnerPinCookieOptions(),
    maxAge: 0,
  };
}

export async function getOwnerPinSetting() {
  return prisma.setting.findUnique({
    where: {
      key: OWNER_PIN_SETTING_KEY,
    },
  });
}

export async function isOwnerPinSet() {
  const setting = await getOwnerPinSetting();
  return Boolean(setting?.value && setting.value.trim().length > 0);
}

export async function isOwnerUser(user: { id: string; email: string; role: string; isActive: boolean }) {
  if (!user.isActive || user.role?.toString().trim().toUpperCase() !== 'ADMIN') {
    return false;
  }

  let configuredEmail = '';

  try {
    const ownerSetting = await prisma.setting.findUnique({
      where: { key: OWNER_EMAIL_SETTING_KEY },
    });
    configuredEmail = normalizeEmail(ownerSetting?.value);
  } catch (error) {
    console.error(
      '[ownerGuard] Failed to load owner_user_email; denying owner access.',
      error,
    );
    return false;
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail);

  if (!isValidEmail) {
    console.warn(
      '[ownerGuard] owner_user_email is missing or invalid; denying owner access.',
    );
    return false;
  }

  return normalizeEmail(user.email) === configuredEmail;
}

export async function getOwnerUser(request?: NextRequest) {
  let token: string | undefined;
  const cookieName = getAuthCookieName();

  if (request) {
    token = request.cookies.get(cookieName)?.value;
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(cookieName)?.value;
    } catch {
      // Ignored if outside request store context
    }
  }

  const payload = token ? await verifyJWT(token) : null;

  if (!payload?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !(await isOwnerUser(user))) {
    return null;
  }

  return user;
}

export async function requireOwner(request?: NextRequest) {
  const owner = await getOwnerUser(request);

  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return null;
}

export async function hasOwnerPinSession(expectedUserId?: string, request?: NextRequest) {
  let token: string | undefined;
  const pinCookieName = getOwnerPinCookieName();

  if (request) {
    token = request.cookies.get(pinCookieName)?.value;
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(pinCookieName)?.value;
    } catch {
      // Ignored if outside request store context
    }
  }

  if (!token) {
    return false;
  }

  const payload = await verifyOwnerPinJWT(token);

  if (!payload?.userId) {
    return false;
  }

  return expectedUserId ? payload.userId === expectedUserId : true;
}

export async function requireOwnerPinAccess(request?: NextRequest) {
  const owner = await getOwnerUser(request);

  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const pinSet = await isOwnerPinSet();
  if (!pinSet) {
    return NextResponse.json({ error: 'Owner PIN setup required', isPinSet: false }, { status: 428 });
  }

  const hasPin = await hasOwnerPinSession(owner.id, request);

  if (!hasPin) {
    return NextResponse.json({ error: 'Owner PIN required' }, { status: 423 });
  }

  return null;
}

export async function verifyOwnerPin(pin: string) {
  const setting = await getOwnerPinSetting();
  if (!setting?.value) {
    return false;
  }
  return comparePassword(pin, setting.value);
}

export async function updateOwnerPin(pin: string) {
  const hashedPin = await hashPassword(pin);

  return prisma.setting.upsert({
    where: {
      key: OWNER_PIN_SETTING_KEY,
    },
    update: {
      value: hashedPin,
    },
    create: {
      key: OWNER_PIN_SETTING_KEY,
      value: hashedPin,
    },
  });
}

export async function deleteOwnerPin() {
  return prisma.setting.deleteMany({
    where: { key: OWNER_PIN_SETTING_KEY },
  });
}

export async function createOwnerPinSession(userId: string) {
  return createOwnerPinJWT(userId);
}
