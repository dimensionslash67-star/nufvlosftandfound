import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { getAuthPayloadFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { itemUpdateSchema } from '@/lib/validations';

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

async function getExistingItem(id: string) {
  return prisma.item.findUnique({
    where: { id },
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
      claimer: {
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
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await getExistingItem(id);

    if (!item) {
      return NextResponse.json({ message: 'Item not found.' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Get item error:', error);

    return NextResponse.json({ message: 'Unable to fetch item.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getAuthPayloadFromRequest(request);

    if (!payload?.userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { id: true, reporterId: true },
    });

    if (!existingItem) {
      return NextResponse.json({ message: 'Item not found.' }, { status: 404 });
    }

    if (payload.role !== 'ADMIN' && existingItem.reporterId !== payload.userId) {
      return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    const json = await request.json();
    const parsed = itemUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Validation failed.',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        itemName: parsed.data.itemName?.trim(),
        description:
          parsed.data.description !== undefined
            ? normalizeOptionalString(parsed.data.description)
            : undefined,
        category: parsed.data.category,
        location: parsed.data.location?.trim(),
        contactInfo:
          parsed.data.contactInfo !== undefined
            ? normalizeOptionalString(parsed.data.contactInfo)
            : undefined,
        imageUrl:
          parsed.data.imageUrl !== undefined
            ? normalizeOptionalString(parsed.data.imageUrl)
            : undefined,
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
      action: 'ITEM_UPDATED',
      entityType: 'ITEM',
      entityId: item.id,
      details: parsed.data,
      request,
    });

    return NextResponse.json({
      message: 'Item updated successfully.',
      item,
    });
  } catch (error) {
    console.error('Update item error:', error);

    return NextResponse.json({ message: 'Unable to update item.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getAuthPayloadFromRequest(request);

    if (!payload?.userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { id: true, reporterId: true, itemName: true },
    });

    if (!existingItem) {
      return NextResponse.json({ message: 'Item not found.' }, { status: 404 });
    }

    if (payload.role !== 'ADMIN' && existingItem.reporterId !== payload.userId) {
      return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    await prisma.item.delete({ where: { id } });

    await createAuditLog({
      userId: payload.userId,
      action: 'ITEM_DELETED',
      entityType: 'ITEM',
      entityId: id,
      details: { itemName: existingItem.itemName },
      request,
    });

    return NextResponse.json({ message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('Delete item error:', error);

    return NextResponse.json({ message: 'Unable to delete item.' }, { status: 500 });
  }
}
