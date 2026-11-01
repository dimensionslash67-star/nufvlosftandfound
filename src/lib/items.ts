import { Prisma } from '@prisma/client';
import { ITEMS_PER_PAGE } from './constants';
import { getCurrentUser } from './auth';
import { projectPublicItem } from './itemVisibility';
import { prisma } from './prisma';
import { itemQuerySchema } from './validations';
import type { Item } from '@/types/item';

type RawSearchParams = Record<string, string | string[] | undefined>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseItemFilters(
  searchParams: RawSearchParams,
  defaults?: { status?: string; publicOnly?: boolean },
) {
  return itemQuerySchema.parse({
    page: readParam(searchParams.page),
    status: defaults?.publicOnly ? 'PENDING' : readParam(searchParams.status) ?? defaults?.status,
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

  if (defaults?.publicOnly) {
    where.status = 'PENDING';
  } else if (filters.status) {
    where.status = filters.status;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.search) {
    const searchClauses: Prisma.ItemWhereInput[] = [
      { itemCode: { contains: filters.search, mode: 'insensitive' } },
      { itemName: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { location: { contains: filters.search, mode: 'insensitive' } },
      { category: { contains: filters.search, mode: 'insensitive' } },
    ];

    if (!defaults?.publicOnly) {
      searchClauses.push(
        { id: { contains: filters.search, mode: 'insensitive' } },
        { contactInfo: { contains: filters.search, mode: 'insensitive' } },
      );
    }

    where.OR = searchClauses;
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
  let publicOnly = defaults?.publicOnly === true;

  try {
    const currentUser = await getCurrentUser();
    publicOnly = publicOnly || !currentUser;
    const effectiveDefaults = { ...defaults, publicOnly };
    const filters = parseItemFilters(searchParams, effectiveDefaults);
    const pageSize = defaults?.take ?? ITEMS_PER_PAGE;
    const where = buildItemWhere(searchParams, effectiveDefaults);
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

    const sanitizedItems = publicOnly
      ? items.map((item) => projectPublicItem(item as unknown as Item) as unknown as Item)
      : (items as unknown as Item[]);

    return {
      items: sanitizedItems,
      filters,
      pagination: {
        page: filters.page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  } catch (error) {
    console.error('getItemsPage error:', error);
    const filters = parseItemFilters(searchParams, { ...defaults, publicOnly });
    const pageSize = defaults?.take ?? ITEMS_PER_PAGE;
    return {
      items: [],
      filters,
      pagination: {
        page: 1,
        pageSize,
        totalItems: 0,
        totalPages: 1,
      },
    };
  }
}

export async function getItemById(id: string) {
  try {
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
  } catch (error) {
    console.error('getItemById error:', error);
    return null;
  }
}

export async function getEditableItemById(
  id: string,
  viewer: { id: string; role: string },
) {
  try {
    const item = await prisma.item.findFirst({
      where: {
        id,
        OR: viewer.role?.toString().trim().toUpperCase() === 'ADMIN'
          ? undefined
          : [{ reporterId: viewer.id }],
      },
      select: {
        id: true,
        itemCode: true,
        itemName: true,
        description: true,
        category: true,
        location: true,
        contactInfo: true,
        imageUrl: true,
      },
    });

    if (!item) {
      return null;
    }

    return {
      id: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      description: item.description,
      category: item.category,
      location: item.location,
      contactInfo: item.contactInfo,
      imageUrl: item.imageUrl,
    };
  } catch (error) {
    console.error('getEditableItemById error:', error);
    return null;
  }
}
