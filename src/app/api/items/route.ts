import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { getAuthPayloadFromRequest } from '@/lib/auth';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { generateItemCode } from '@/lib/itemCode';
import { prisma } from '@/lib/prisma';
import { itemQuerySchema, itemSchema } from '@/lib/validations';

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

function getDateRange(range: 'today' | '7days' | '30days' | '90days') {
  const now = new Date();

  if (range === 'today') {
    return new Date(now.setHours(0, 0, 0, 0));
  }

  if (range === '7days') {
    return new Date(Date.now() - 7 * 86400000);
  }

  if (range === '30days') {
    return new Date(Date.now() - 30 * 86400000);
  }

  return new Date(Date.now() - 90 * 86400000);
}

function readRawFilters(request: NextRequest) {
  return {
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined,
    status: request.nextUrl.searchParams.get('status')?.toUpperCase() ?? undefined,
    category: request.nextUrl.searchParams.get('category') ?? undefined,
    search: request.nextUrl.searchParams.get('search') ?? undefined,
    location: request.nextUrl.searchParams.get('location') ?? undefined,
    date: request.nextUrl.searchParams.get('date') ?? undefined,
    disposal: request.nextUrl.searchParams.get('disposal') ?? undefined,
    dateFrom: request.nextUrl.searchParams.get('dateFrom') ?? undefined,
    dateTo: request.nextUrl.searchParams.get('dateTo') ?? undefined,
  };
}

function buildItemWhere(
  filters: ReturnType<typeof itemQuerySchema.parse>,
  options?: { publicOnly?: boolean },
): Prisma.ItemWhereInput {
  const andClauses: Prisma.ItemWhereInput[] = [];

  if (options?.publicOnly) {
    andClauses.push({ status: 'PENDING' });
    andClauses.push({ isFlagged: false });
  }

  if (filters.disposal === 'true') {
    andClauses.push({
      OR: [
        { status: 'DISPOSED' },
        { isDisposed: true },
        {
          AND: [
            { dueDate: { lte: new Date() } },
            { status: 'PENDING' },
          ],
        },
      ],
    });
  }

  if (filters.status) {
    andClauses.push({ status: filters.status });
  }

  if (filters.category) {
    andClauses.push({ category: filters.category });
  }

  if (filters.location) {
    andClauses.push({
      location: { contains: filters.location, mode: 'insensitive' },
    });
  }

  if (filters.date) {
    andClauses.push({
      dateReported: { gte: getDateRange(filters.date) },
    });
  }

  if (filters.dateFrom || filters.dateTo) {
    const dateReported: Prisma.DateTimeFilter = {};

    if (filters.dateFrom) {
      dateReported.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    }

    if (filters.dateTo) {
      dateReported.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
    }

    andClauses.push({ dateReported });
  }

  if (filters.search) {
    andClauses.push({
      OR: [
        { itemCode: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
        { itemName: { contains: filters.search, mode: 'insensitive' } },
      ],
    });
  }

  return andClauses.length > 0 ? { AND: andClauses } : {};
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuthPayloadFromRequest(request);
    const rawFilters = readRawFilters(request);
    const filters = itemQuerySchema.parse(rawFilters);
    const pageSize = filters.pageSize ?? ITEMS_PER_PAGE;
    const where = buildItemWhere(filters, { publicOnly: !payload?.userId });
    const skip = (filters.page - 1) * pageSize;

    const [items, totalItems] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: [{ dateReported: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
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
      }),
      prisma.item.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total: totalItems,
      pagination: {
        page: filters.page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
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

    const itemCode = await generateItemCode();
    const dateReported = parseOptionalDate(parsed.data.dateReported) ?? new Date();
    const dueDate = parseOptionalDate(parsed.data.dueDate);

    const item = await prisma.item.create({
      data: {
        itemCode,
        itemName: parsed.data.itemName.trim(),
        description: normalizeOptionalString(parsed.data.description),
        category: parsed.data.category,
        location: parsed.data.location.trim(),
        dateReported,
        dueDate,
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
        itemCode: item.itemCode,
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
