import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { getOwnerUser, requireOwnerPinAccess, updateOwnerPin, verifyOwnerPin } from '@/lib/ownerGuard';

export async function POST(request: NextRequest) {
  const guard = await requireOwnerPinAccess();

  if (guard) {
    return guard;
  }

  const owner = await getOwnerUser();

  if (!owner) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    currentPin?: string;
    newPin?: string;
    confirmPin?: string;
  };

  if (!body.currentPin || !/^\d{4}$/.test(body.currentPin)) {
    return NextResponse.json({ message: 'Enter your current 4-digit PIN.' }, { status: 400 });
  }

  if (!body.newPin || !/^\d{4}$/.test(body.newPin)) {
    return NextResponse.json({ message: 'New PIN must be exactly 4 digits.' }, { status: 400 });
  }

  if (body.newPin !== body.confirmPin) {
    return NextResponse.json({ message: 'New PIN and confirmation do not match.' }, { status: 400 });
  }

  if (body.currentPin === body.newPin) {
    return NextResponse.json({ message: 'Choose a different PIN.' }, { status: 400 });
  }

  const validCurrentPin = await verifyOwnerPin(body.currentPin);

  if (!validCurrentPin) {
    return NextResponse.json({ message: 'Current PIN is incorrect.' }, { status: 401 });
  }

  await updateOwnerPin(body.newPin);

  await createAuditLog({
    userId: owner.id,
    action: 'OWNER_PIN_CHANGED',
    entityType: 'OWNER',
    entityId: owner.id,
    details: {
      changedBy: owner.email,
    },
    request,
  });

  return NextResponse.json({ message: 'Owner PIN updated successfully.' });
}
