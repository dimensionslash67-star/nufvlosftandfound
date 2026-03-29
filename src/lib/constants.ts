export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'NUFV Lost and Found';

export const ITEM_STATUSES = ['PENDING', 'CLAIMED', 'RETURNED', 'DISPOSED'] as const;

export const USER_ROLES = ['ADMIN', 'USER'] as const;

export const ITEM_CATEGORIES = [
  'Electronics',
  'School Supplies',
  'Personal Item',
  'Wallet with Cash',
  'Other Materials',
  'Clothing',
  'Accessories',
  'Books',
  'Bags',
  'Tumbler',
  'Keys',
  'Documents',
  'Sports Equipment',
  'Jewelry',
] as const;

export const ITEMS_PER_PAGE = 20;

export const ITEM_STATUS_LABELS: Record<(typeof ITEM_STATUSES)[number], string> = {
  PENDING: 'Available',
  CLAIMED: 'Claimed',
  RETURNED: 'Returned',
  DISPOSED: 'Disposed',
};

export const ITEM_STATUS_CLASSES: Record<(typeof ITEM_STATUSES)[number], string> = {
  PENDING: 'bg-green-100 text-green-800 border border-green-300',
  CLAIMED: 'bg-blue-100 text-blue-800 border border-blue-300',
  RETURNED: 'bg-teal-100 text-teal-800 border border-teal-300',
  DISPOSED: 'bg-pink-100 text-pink-800 border border-pink-300',
};
