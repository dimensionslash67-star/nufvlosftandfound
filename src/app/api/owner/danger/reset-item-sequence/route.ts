import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { generateItemCode } from '@/lib/itemCode';
import { getOwnerUser, requireOwnerPinAccess } from '@/lib/ownerGuard';

export async function GET() {
  const guard = await requireOwnerPinAccess();

  if (guard) {
    return guard;
  }

  const nextItemCode = await generateItemCode();

  return NextResponse.json({
    nextItemCode,
    message: 'Sequence preview generated from the current dataset.',
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireOwnerPinAccess();

  if (guard) {
    return guard;
  }

  const owner = await getOwnerUser();

  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const nextItemCode = await generateItemCode();

  await createAuditLog({
    userId: owner.id,
    action: 'OWNER_RESET_ITEM_CODE_SEQUENCE',
    entityType: 'OWNER',
    entityId: owner.id,
    details: {
      nextItemCode,
      note: 'Owner synced the next item code preview to the current dataset.',
    },
    request,
  });

  return NextResponse.json({
    message: 'Item code sequence synced to the next available code.',
    nextItemCode,
  });
}
