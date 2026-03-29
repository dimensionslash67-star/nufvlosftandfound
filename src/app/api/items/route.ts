import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { getAuthPayloadFromRequest } from '@/lib/auth';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { itemQuerySchema, itemSchema } from '@/lib/validations';

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildItemWhere(searchParams: Record<string, string | undefined>): Prisma.ItemWhereInput {
  const filters = itemQuerySchema.parse(searchParams);
  const where: Prisma.ItemWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.search) {
    where.OR = [
      { id: { contains: filters.search, mode: 'insensitive' } },
      { itemName: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { location: { contains: filters.search, mode: 'insensitive' } },
      { contactInfo: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.location) {
    where.location = { contains: filters.location, mode: 'insensitive' };
  }

  if (filters.dateFrom || filters.dateTo) {
    where.dateReported = {};

    if (filters.dateFrom) {
      where.dateReported.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    }

    if (filters.dateTo) {
      where.dateReported.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
    }
  }

  return where;
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuthPayloadFromRequest(request);
    const rawFilters = {
      page: request.nextUrl.searchParams.get('page') ?? undefined,
      status: request.nextUrl.searchParams.get('status') ?? undefined,
      category: request.nextUrl.searchParams.get('category') ?? undefined,
      search: request.nextUrl.searchParams.get('search') ?? undefined,
      location: request.nextUrl.searchParams.get('location') ?? undefined,
      dateFrom: request.nextUrl.searchParams.get('dateFrom') ?? undefined,
      dateTo: request.nextUrl.searchParams.get('dateTo') ?? undefined,
    };

    const filters = itemQuerySchema.parse(rawFilters);
    const where = buildItemWhere(rawFilters);

    if (!payload?.userId) {
      where.status = 'PENDING';
      where.isFlagged = false;
    }

    const skip = (filters.page - 1) * ITEMS_PER_PAGE;

    const [items, totalItems] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: { dateReported: 'desc' },
        skip,
        take: ITEMS_PER_PAGE,
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
      }),
      prisma.item.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page: filters.page,
        pageSize: ITEMS_PER_PAGE,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
      },
      filters,
    });
  } catch (error) {
    console.error('List items error:', error);

    return NextResponse.json({ message: 'Unable to fetch items.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthPayloadFromRequest(request);

    if (!payload?.userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = itemSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Validation failed.',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const item = await prisma.item.create({
      data: {
        itemName: parsed.data.itemName.trim(),
        description: normalizeOptionalString(parsed.data.description),
        category: parsed.data.category,
        location: parsed.data.location.trim(),
        contactInfo: normalizeOptionalString(parsed.data.contactInfo),
        imageUrl: normalizeOptionalString(parsed.data.imageUrl),
        reporterId: payload.userId,
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
      action: 'ITEM_CREATED',
      entityType: 'ITEM',
      entityId: item.id,
      details: {
        itemName: item.itemName,
        category: item.category,
        status: item.status,
      },
      request,
    });

    return NextResponse.json(
      {
        message: 'Item created successfully.',
        item,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Create item error:', error);

    return NextResponse.json({ message: 'Unable to create item.' }, { status: 500 });
  }
}
