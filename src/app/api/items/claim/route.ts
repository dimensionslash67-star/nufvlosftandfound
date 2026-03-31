import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';
import { getAuthPayloadFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const claimSchema = z.object({
  itemId: z.string().min(1),
  claimData: z.object({
    claimerName: z.string().trim().min(1),
    claimerEmail: z.string().trim().email(),
    claimerPhone: z.string().trim().optional().or(z.literal('')),
    claimerIdNumber: z.string().trim().min(1),
    relationshipToItem: z.string().trim().optional().or(z.literal('')),
    verificationNotes: z.string().trim().optional().or(z.literal('')),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthPayloadFromRequest(request);

    if (!payload?.userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = claimSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed.' }, { status: 400 });
    }

    const existingItem = await prisma.item.findUnique({
      where: { id: parsed.data.itemId },
      select: {
        id: true,
        itemCode: true,
        itemName: true,
        status: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ message: 'Item not found.' }, { status: 404 });
    }

    if (existingItem.status !== 'PENDING') {
      return NextResponse.json({ message: 'Only pending items can be claimed.' }, { status: 400 });
    }

    const item = await prisma.item.update({
      where: { id: parsed.data.itemId },
      data: {
        status: 'CLAIMED',
        claimerId: payload.userId,
        claimedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: payload.userId,
      action: 'ITEM_CLAIMED',
      entityType: 'ITEM',
      entityId: item.id,
      details: {
        itemCode: existingItem.itemCode,
        itemName: existingItem.itemName,
        claimerInfo: parsed.data.claimData,
      },
      request,
    });

    return NextResponse.json({ message: 'Item claimed successfully.', item });
  } catch (error) {
    console.error('Claim item error:', error);
    return NextResponse.json({ message: 'Failed to claim item.' }, { status: 500 });
  }
}
