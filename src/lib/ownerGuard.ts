import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  comparePassword,
  createOwnerPinJWT,
  getAuthCookieName,
  hashPassword,
  verifyJWT,
  verifyOwnerPinJWT,
} from './auth';
import {
  OWNER_DEFAULT_PIN,
  OWNER_EMAIL,
  OWNER_PIN_COOKIE_NAME,
  OWNER_PIN_MAX_AGE,
  OWNER_PIN_SETTING_KEY,
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

async function getOwnerPinSetting() {
  const existing = await prisma.setting.findUnique({
    where: {
      key: OWNER_PIN_SETTING_KEY,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.setting.create({
    data: {
      key: OWNER_PIN_SETTING_KEY,
      value: await hashPassword(OWNER_DEFAULT_PIN),
    },
  });
}

export async function getOwnerUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAuthCookieName())?.value;
  const payload = token ? await verifyJWT(token) : null;

  if (!payload?.userId || payload.email !== OWNER_EMAIL) {
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

  if (!user || !user.isActive || user.email !== OWNER_EMAIL) {
    return null;
  }

  return user;
}

export async function requireOwner() {
  const owner = await getOwnerUser();

  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return null;
}

export async function hasOwnerPinSession(expectedUserId?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getOwnerPinCookieName())?.value;

  if (!token) {
    return false;
  }

  const payload = await verifyOwnerPinJWT(token);

  if (!payload?.userId) {
    return false;
  }

  return expectedUserId ? payload.userId === expectedUserId : true;
}

export async function requireOwnerPinAccess() {
  const owner = await getOwnerUser();

  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const hasPin = await hasOwnerPinSession(owner.id);

  if (!hasPin) {
    return NextResponse.json({ error: 'Owner PIN required' }, { status: 423 });
  }

  return null;
}

export async function verifyOwnerPin(pin: string) {
  const setting = await getOwnerPinSetting();
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

export async function createOwnerPinSession(userId: string) {
  return createOwnerPinJWT(userId);
}
