import { NextRequest, NextResponse } from 'next/server';
import {
  createOwnerPinSession,
  getOwnerPinCookieName,
  getOwnerPinCookieOptions,
  getOwnerUser,
  isOwnerPinSet,
  requireOwner,
  updateOwnerPin,
  verifyOwnerPin,
} from '@/lib/ownerGuard';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// Strict limit: 5 PIN attempts per 15 minutes per IP.
// The 4-digit PIN space is only 10,000 combinations — brute force must be blocked hard.
const PIN_LIMIT = 5;
const PIN_WINDOW_MS = 15 * 60 * 1000;

export async function GET(request: NextRequest) {
  const guard = await requireOwner();

  if (guard) {
    return guard;
  }

  const isPinSet = await isOwnerPinSet();
  return NextResponse.json({ isPinSet });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`owner-pin:${ip}`, PIN_LIMIT, PIN_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { message: 'Too many PIN attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) },
      },
    );
  }

  const guard = await requireOwner();

  if (guard) {
    return guard;
  }

  const owner = await getOwnerUser();

  if (!owner) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { pin?: string; setupPin?: string };
  const pin = body.pin || body.setupPin;

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ message: 'Enter a valid 4-digit PIN.' }, { status: 400 });
  }

  const pinSet = await isOwnerPinSet();

  if (!pinSet) {
    // Initial PIN setup flow: set up PIN for the first time
    await updateOwnerPin(pin);
    const token = await createOwnerPinSession(owner.id);
    const response = NextResponse.json({ message: 'Owner PIN setup complete.', isPinSet: true });
    response.cookies.set(getOwnerPinCookieName(), token, getOwnerPinCookieOptions());
    return response;
  }

  const valid = await verifyOwnerPin(pin);

  if (!valid) {
    return NextResponse.json({ message: 'Incorrect owner PIN.' }, { status: 401 });
  }

  const token = await createOwnerPinSession(owner.id);
  const response = NextResponse.json({ message: 'Owner PIN verified.' });
  response.cookies.set(getOwnerPinCookieName(), token, getOwnerPinCookieOptions());
  return response;
}
