import { Prisma } from '@prisma/client';
import { ITEMS_PER_PAGE } from './constants';
import { prisma } from './prisma';
import { itemQuerySchema } from './validations';
import type { Item } from '@/types/item';

type RawSearchParams = Record<string, string | string[] | undefined>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseItemFilters(searchParams: RawSearchParams, defaults?: { status?: string }) {
  return itemQuerySchema.parse({
    page: readParam(searchParams.page),
    status: readParam(searchParams.status) ?? defaults?.status,
    category: readParam(searchParams.category),
    search: readParam(searchParams.search),
    location: readParam(searchParams.location),
    dateFrom: readParam(searchParams.dateFrom),
    dateTo: readParam(searchParams.dateTo),
  });
}

export function buildItemWhere(
  searchParams: RawSearchParams,
  defaults?: { status?: string; publicOnly?: boolean },
): Prisma.ItemWhereInput {
  const filters = parseItemFilters(searchParams, defaults);
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
      { itemCode: { contains: filters.search, mode: 'insensitive' } },
      { itemName: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { location: { contains: filters.search, mode: 'insensitive' } },
      { contactInfo: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.location) {
    where.location = { contains: filters.location, mode: 'insensitive' };
  }

  if (defaults?.publicOnly) {
    where.isFlagged = false;
    where.isDisposed = false;
    where.disposalDate = null;
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

export async function getItemsPage(
  searchParams: RawSearchParams,
  defaults?: { status?: string; take?: number; publicOnly?: boolean },
) {
  const filters = parseItemFilters(searchParams, defaults);
  const pageSize = defaults?.take ?? ITEMS_PER_PAGE;
  const where = buildItemWhere(searchParams, defaults);
  const skip = (filters.page - 1) * pageSize;

  const [items, totalItems] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: { dateReported: 'desc' },
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

  return {
    items: items as unknown as Item[],
    filters,
    pagination: {
      page: filters.page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  };
}

export async function getItemById(id: string) {
  const item = await prisma.item.findUnique({
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

  return item as unknown as Item | null;
}
