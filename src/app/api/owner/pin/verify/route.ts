import { NextRequest, NextResponse } from 'next/server';
import { getOwnerUser, createOwnerPinSession, getOwnerPinCookieName, getOwnerPinCookieOptions, requireOwner, verifyOwnerPin } from '@/lib/ownerGuard';

export async function POST(request: NextRequest) {
  const guard = await requireOwner();

  if (guard) {
    return guard;
  }

  const owner = await getOwnerUser();

  if (!owner) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 403 });
  }

  const { pin } = (await request.json().catch(() => ({ pin: '' }))) as { pin?: string };

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ message: 'Enter the 4-digit owner PIN.' }, { status: 400 });
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
