import type { Item, ItemUserSummary } from '@/types/item';

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

function stripPersonEmail<T extends ItemUserSummary>(
  person: T,
): Omit<T, 'email'> {
  const { email: _email, ...safePerson } = person;
  return safePerson;
}

export function sanitizeItemForRestrictedView<TItem extends Item>(item: TItem): TItem {
  if (!item) {
    return item;
  }

  const sanitized = { ...item } as Item;

  delete (sanitized as Partial<Item>).contactInfo;
  delete (sanitized as Partial<Item>).claimerIdNumber;
  delete (sanitized as Partial<Item>).relationshipToItem;
  delete (sanitized as Partial<Item>).verificationNotes;

  if (sanitized.reporter) {
    sanitized.reporter = stripPersonEmail(sanitized.reporter);
  }

  if (sanitized.claimer) {
    sanitized.claimer = stripPersonEmail(sanitized.claimer);
  }

  return sanitized as TItem;
}