import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';
import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';
import type { NextRequest } from 'next/server';
import { getAuthCookieName, getAuthPayloadFromRequest, verifyJWT } from './auth';
import { ITEMS_PER_PAGE, ITEM_STATUS_LABELS } from './constants';
import { prisma } from './prisma';
import { formatDisplayDate, getUserDisplayName } from './utils';

const SETTING_KEYS = {
  siteName: 'site_name',
  maxFileSize: 'max_file_size',
  retentionDays: 'item_retention_days',
  adminEmail: 'admin_email',
} as const;

function buildDateRangeWhere(field: 'createdAt' | 'dateReported', dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  const range: { gte?: Date; lte?: Date } = {};

  if (dateFrom) {
    range.gte = new Date(`${dateFrom}T00:00:00.000Z`);
  }

  if (dateTo) {
    range.lte = new Date(`${dateTo}T23:59:59.999Z`);
  }

  return { [field]: range } as Prisma.ItemWhereInput | Prisma.UserWhereInput | Prisma.AuditLogWhereInput;
}

export async function requireAdminPayload(request: NextRequest) {
  const payload = await getAuthPayloadFromRequest(request);

  if (!payload?.userId || payload.role !== 'ADMIN') {
    return null;
  }

  return payload;
}

export async function getAdminSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAuthCookieName())?.value;
  const payload = token ? await verifyJWT(token) : null;

  if (!payload?.userId || payload.role !== 'ADMIN') {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getAdminStatisticsData() {
  const [totalItems, availableItems, claimedItems, disposedItems, totalUsers, activeUsers, recentItems] =
    await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { status: 'PENDING' } }),
      prisma.item.count({ where: { status: 'CLAIMED' } }),
      prisma.item.count({ where: { status: 'DISPOSED' } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.item.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

  return {
    totals: {
      totalItems,
      availableItems,
      claimedItems,
      disposedItems,
      totalUsers,
      activeUsers,
    },
    recentItems,
  };
}

export async function getUsersPageData({
  page = 1,
  search,
}: {
  page?: number;
  search?: string;
}) {
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [users, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      pageSize: ITEMS_PER_PAGE,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
    },
  };
}

export async function getAuditLogsPageData({
  page = 1,
  search,
  action,
  dateFrom,
  dateTo,
}: {
  page?: number;
  search?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(buildDateRangeWhere('createdAt', dateFrom, dateTo) as Prisma.AuditLogWhereInput),
    ...(search
      ? {
          OR: [
            { user: { username: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { entityType: { contains: search, mode: 'insensitive' } },
            { action: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [logs, totalItems] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
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
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      pageSize: ITEMS_PER_PAGE,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
    },
  };
}

export async function getSettingsData() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: Object.values(SETTING_KEYS),
      },
    },
  });

  const map = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    siteName: map.get(SETTING_KEYS.siteName) ?? 'NUFV Lost and Found',
    maxFileSize: Number(map.get(SETTING_KEYS.maxFileSize) ?? process.env.NEXT_PUBLIC_MAX_FILE_SIZE ?? 5242880),
    retentionDays: Number(map.get(SETTING_KEYS.retentionDays) ?? 30),
    adminEmail: map.get(SETTING_KEYS.adminEmail) ?? 'admin@nufairview.edu.ph',
  };
}

export async function saveSettingsData(values: {
  siteName: string;
  maxFileSize: number;
  retentionDays: number;
  adminEmail: string;
}) {
  await Promise.all([
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.siteName },
      update: { value: values.siteName },
      create: { key: SETTING_KEYS.siteName, value: values.siteName },
    }),
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.maxFileSize },
      update: { value: String(values.maxFileSize) },
      create: { key: SETTING_KEYS.maxFileSize, value: String(values.maxFileSize) },
    }),
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.retentionDays },
      update: { value: String(values.retentionDays) },
      create: { key: SETTING_KEYS.retentionDays, value: String(values.retentionDays) },
    }),
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.adminEmail },
      update: { value: values.adminEmail },
      create: { key: SETTING_KEYS.adminEmail, value: values.adminEmail },
    }),
  ]);
}

export type ReportType = 'items' | 'claims' | 'users' | 'audit';

export async function getReportStatsData({
  days = 30,
}: {
  days?: number;
} = {}) {
  const startDate = startOfDay(subDays(new Date(), Math.max(days - 1, 0)));

  const [totalItems, available, claimed, disposed, byCategoryGroups, recentItems] = await Promise.all([
    prisma.item.count(),
    prisma.item.count({ where: { status: 'PENDING' } }),
    prisma.item.count({ where: { status: 'CLAIMED' } }),
    prisma.item.count({ where: { status: 'DISPOSED' } }),
    prisma.item.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
      orderBy: {
        category: 'asc',
      },
    }),
    prisma.item.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        createdAt: true,
      },
    }),
  ]);

  const countsByDate = new Map<string, number>();
  for (const item of recentItems) {
    const key = format(item.createdAt, 'yyyy-MM-dd');
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  }

  const byDate = eachDayOfInterval({
    start: startDate,
    end: startOfDay(new Date()),
  }).map((date) => {
    const key = format(date, 'yyyy-MM-dd');
    return {
      date: key,
      count: countsByDate.get(key) ?? 0,
    };
  });

  const byCategory = byCategoryGroups
    .map((group) => ({
      category: group.category,
      count: group._count.category,
    }))
    .sort((left, right) => right.count - left.count);

  return {
    totalItems,
    available,
    claimed,
    disposed,
    byDate,
    byCategory,
  };
}

export async function getReportPreviewData({
  type,
  dateFrom,
  dateTo,
  page = 1,
}: {
  type: ReportType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}) {
  if (type === 'users') {
    const where: Prisma.UserWhereInput = {
      ...(buildDateRangeWhere('createdAt', dateFrom, dateTo) as Prisma.UserWhereInput),
    };
    const [rows, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      type,
      rows: rows.map((row) => ({
        ID: row.id,
        Username: row.username,
        Email: row.email,
        Role: row.role,
        Active: row.isActive ? 'Active' : 'Inactive',
        'Created At': formatDisplayDate(row.createdAt, 'MMM d, yyyy'),
      })),
      columns: ['ID', 'Username', 'Email', 'Role', 'Active', 'Created At'],
      pagination: {
        page,
        pageSize: ITEMS_PER_PAGE,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
      },
    };
  }

  if (type === 'claims') {
    const where: Prisma.ItemWhereInput = {
      status: 'CLAIMED',
      ...(buildDateRangeWhere('dateReported', dateFrom, dateTo) as Prisma.ItemWhereInput),
    };
    const [rows, totalItems] = await Promise.all([
      prisma.item.findMany({
        where,
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        orderBy: { claimedAt: 'desc' },
        select: {
          id: true,
          itemCode: true,
          itemName: true,
          category: true,
          location: true,
          claimedAt: true,
          claimer: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.item.count({ where }),
    ]);

    return {
      type,
      rows: rows.map((row) => ({
        'Item Code': row.itemCode ?? row.id,
        'Item Name': row.itemName,
        Category: row.category,
        Location: row.location,
        Claimer: getUserDisplayName(row.claimer ?? undefined),
        'Claimed At': row.claimedAt ? formatDisplayDate(row.claimedAt, 'MMM d, yyyy h:mm a') : '—',
      })),
      columns: ['Item Code', 'Item Name', 'Category', 'Location', 'Claimer', 'Claimed At'],
      pagination: {
        page,
        pageSize: ITEMS_PER_PAGE,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
      },
    };
  }

  if (type === 'audit') {
    const where: Prisma.AuditLogWhereInput = {
      ...(buildDateRangeWhere('createdAt', dateFrom, dateTo) as Prisma.AuditLogWhereInput),
    };
    const [rows, totalItems] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      type,
      rows: rows.map((row) => ({
        Timestamp: formatDisplayDate(row.createdAt, 'MMM d, yyyy h:mm a'),
        User: getUserDisplayName({
          username: row.user?.username,
        }),
        Action: row.action,
        Entity: row.entityType,
        Details: JSON.stringify(row.details ?? {}),
      })),
      columns: ['Timestamp', 'User', 'Action', 'Entity', 'Details'],
      pagination: {
        page,
        pageSize: ITEMS_PER_PAGE,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
      },
    };
  }

  const where: Prisma.ItemWhereInput = {
    ...(buildDateRangeWhere('dateReported', dateFrom, dateTo) as Prisma.ItemWhereInput),
  };
  const [rows, totalItems] = await Promise.all([
    prisma.item.findMany({
      where,
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      orderBy: { dateReported: 'desc' },
      select: {
        id: true,
        itemCode: true,
        itemName: true,
        category: true,
        location: true,
        status: true,
        dateReported: true,
      },
    }),
    prisma.item.count({ where }),
  ]);

  return {
    type,
    rows: rows.map((row) => ({
      'Item Code': row.itemCode ?? row.id,
      'Item Name': row.itemName,
      Category: row.category,
      Location: row.location,
      Status: ITEM_STATUS_LABELS[row.status],
      'Date Reported': formatDisplayDate(row.dateReported, 'MMM d, yyyy'),
    })),
    columns: ['Item Code', 'Item Name', 'Category', 'Location', 'Status', 'Date Reported'],
    pagination: {
      page,
      pageSize: ITEMS_PER_PAGE,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
    },
  };
}

function escapeCsvValue(value: unknown) {
  const stringValue =
    value instanceof Date
      ? value.toISOString()
      : typeof value === 'object' && value !== null
        ? JSON.stringify(value)
        : String(value ?? '');

  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function createCsv(columns: string[], rows: Array<Record<string, unknown>>) {
  const header = columns.join(',');
  const body = rows
    .map((row) => columns.map((column) => escapeCsvValue(row[column])).join(','))
    .join('\n');

  return `${header}\n${body}`;
}
