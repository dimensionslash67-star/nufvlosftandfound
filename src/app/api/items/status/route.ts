import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { getAuthPayloadFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { itemStatusSchema } from '@/lib/validations';

export async function PATCH(request: NextRequest) {
  try {
    const payload = await getAuthPayloadFromRequest(request);

    if (!payload?.userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const itemId = url.searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ message: 'Item id is required.' }, { status: 400 });
    }

    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, reporterId: true, status: true },
    });

    if (!existingItem) {
      return NextResponse.json({ message: 'Item not found.' }, { status: 404 });
    }

    if (payload.role !== 'ADMIN' && existingItem.reporterId !== payload.userId) {
      return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    const json = await request.json();
    const parsed = itemStatusSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Validation failed.',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const status = parsed.data.status;
    const claimerId = status === 'CLAIMED' ? parsed.data.claimerId ?? payload.userId : null;
    const claimedAt = status === 'CLAIMED' ? now : null;
    const disposalDate = status === 'DISPOSED' ? now : null;

    const item = await prisma.item.update({
      where: { id: itemId },
      data: {
        status,
        claimerId,
        claimedAt,
        isDisposed: status === 'DISPOSED',
        disposalDate,
        isFlagged: parsed.data.isFlagged,
        flaggedReason: parsed.data.flaggedReason,
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: payload.userId,
      action: 'ITEM_STATUS_UPDATED',
      entityType: 'ITEM',
      entityId: itemId,
      details: {
        previousStatus: existingItem.status,
        nextStatus: status,
        claimerId,
      },
      request,
    });

    return NextResponse.json({
      message: 'Item status updated successfully.',
      item,
    });
  } catch (error) {
    console.error('Update item status error:', error);

    return NextResponse.json({ message: 'Unable to update item status.' }, { status: 500 });
  }
}
