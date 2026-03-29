export type ItemStatus = 'PENDING' | 'CLAIMED' | 'RETURNED' | 'DISPOSED';

export interface ItemUserSummary {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface Item {
  id: string;
  itemName: string;
  description?: string | null;
  category: string;
  location: string;
  dateReported: string | Date;
  status: ItemStatus;
  isFlagged?: boolean;
  flaggedReason?: string | null;
  imageUrl?: string | null;
  contactInfo?: string | null;
  reporterId: string;
  reporter?: ItemUserSummary;
  claimerId?: string | null;
  claimer?: ItemUserSummary | null;
  claimedAt?: string | Date | null;
  disposalDate?: string | Date | null;
  isDisposed?: boolean;
  dueDate?: string | Date | null;
  isOverdue?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
