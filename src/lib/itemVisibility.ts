import type { Item } from '@/types/item';

export type ItemViewer = { id: string; role: string } | null | undefined;

export function canManageItem(
  viewer: ItemViewer,
  reporterId: string | null | undefined,
): boolean {
  if (!viewer) {
    return false;
  }

  if (viewer.role?.toString().trim().toUpperCase() === 'ADMIN') {
    return true;
  }

  return typeof reporterId === 'string' && viewer.id === reporterId;
}

export type PublicItemProjection = {
  id: string;
  itemCode: string | null;
  itemName: string;
  category: string;
  location: string;
  dateReported: Item['dateReported'];
  status: Item['status'];
  imageUrl: string | null;
};

export type RestrictedItemProjection = PublicItemProjection & {
  reporter?: {
    firstName: string | null;
    lastName: string | null;
  };
};

export function projectPublicItem(item: Item): PublicItemProjection {
  return {
    id: item.id,
    itemCode: item.itemCode ?? null,
    itemName: item.itemName,
    category: item.category,
    location: item.location,
    dateReported: item.dateReported,
    status: item.status,
    imageUrl: item.imageUrl ?? null,
  };
}

export function projectRestrictedItem(item: Item): RestrictedItemProjection {
  return {
    ...projectPublicItem(item),
    ...(item.reporter
      ? {
          reporter: {
            firstName: item.reporter.firstName ?? null,
            lastName: item.reporter.lastName ?? null,
          },
        }
      : {}),
  };
}

export function projectItemForViewer(item: Item, viewer: ItemViewer) {
  if (canManageItem(viewer, item.reporterId)) {
    return item;
  }

  return viewer ? projectRestrictedItem(item) : projectPublicItem(item);
}
