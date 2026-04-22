import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { getAuthPayloadFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { itemUpdateSchema } from '@/lib/validations';

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseOptionalDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
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

async function getCurrentUserFromPayload(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
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

    const currentUser = await getCurrentUserFromPayload(payload.userId);

    if (!currentUser?.isActive) {
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

    if (currentUser.role !== 'ADMIN' && existingItem.reporterId !== currentUser.id) {
      return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    const json = await request.json();
    const parsed = itemUpdateSchema.safeParse(json);
    const normalizedStatus =
      typeof json.status === 'string' ? json.status.toUpperCase() : undefined;
    const shouldDispose = normalizedStatus === 'DISPOSED';
    const disposeReason =
      typeof json.disposeReason === 'string' && json.disposeReason.trim()
        ? json.disposeReason.trim()
        : undefined;

    if (!parsed.success) {
      if (normalizedStatus !== 'DISPOSED') {
        return NextResponse.json(
          {
            message: 'Validation failed.',
            errors: parsed.error.flatten().fieldErrors,
          },
          { status: 400 },
        );
      }
    }

    const updateData: Prisma.ItemUpdateInput = {
      itemName: parsed.success ? parsed.data.itemName?.trim() : undefined,
      description:
        parsed.success && parsed.data.description !== undefined
          ? normalizeOptionalString(parsed.data.description)
          : undefined,
      category: parsed.success ? parsed.data.category : undefined,
      location: parsed.success ? parsed.data.location?.trim() : undefined,
      dateReported:
        parsed.success && parsed.data.dateReported !== undefined
          ? parseOptionalDate(parsed.data.dateReported)
          : undefined,
      dueDate:
        parsed.success && parsed.data.dueDate !== undefined
          ? parseOptionalDate(parsed.data.dueDate)
          : undefined,
      contactInfo:
        parsed.success && parsed.data.contactInfo !== undefined
          ? normalizeOptionalString(parsed.data.contactInfo)
          : undefined,
      imageUrl:
        parsed.success && parsed.data.imageUrl !== undefined
          ? normalizeOptionalString(parsed.data.imageUrl)
          : undefined,
      status: shouldDispose ? 'DISPOSED' : undefined,
      isDisposed: shouldDispose ? true : undefined,
      disposalDate: shouldDispose ? new Date() : undefined,
    };

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
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
      action: shouldDispose ? 'ITEM_DISPOSED' : 'ITEM_UPDATED',
      entityType: 'ITEM',
      entityId: item.id,
      details: shouldDispose ? { status: 'DISPOSED', disposeReason } : parsed.data,
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

    const currentUser = await getCurrentUserFromPayload(payload.userId);

    if (!currentUser?.isActive) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { id: true, reporterId: true, itemCode: true, itemName: true },
    });

    if (!existingItem) {
      return NextResponse.json({ message: 'Item not found.' }, { status: 404 });
    }

    if (currentUser.role !== 'ADMIN' && existingItem.reporterId !== currentUser.id) {
      return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    const deletedFrom = request.headers.get('x-delete-source') ?? 'UNKNOWN';

    await prisma.item.delete({ where: { id } });

    await createAuditLog({
      userId: payload.userId,
      action: 'ITEM_DELETED',
      entityType: 'ITEM',
      entityId: id,
      details: {
        itemCode: existingItem.itemCode,
        itemName: existingItem.itemName,
        deletedByRole: currentUser.role,
        deletedByEmail: currentUser.email,
        deletedByScope: currentUser.role === 'ADMIN' ? 'ADMIN' : 'REPORTER',
        deletedFrom,
      },
      request,
    });

    return NextResponse.json({ message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('Delete item error:', error);

    return NextResponse.json({ message: 'Unable to delete item.' }, { status: 500 });
  }
}
