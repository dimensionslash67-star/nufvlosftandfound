import { clsx, type ClassValue } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDisplayDate(value?: string | Date | null, pattern = 'MMM d, yyyy') {
  if (!value) {
    return 'N/A';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return format(date, pattern);
}

export function formatItemCode(value?: string | null) {
  if (!value) {
    return 'ITEM-XXXX-0000';
  }

  return value.startsWith('ITEM-') ? value : 'ITEM-XXXX-0000';
}

export function getUserDisplayName(user?: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return name || user?.username || 'Staff User';
}
