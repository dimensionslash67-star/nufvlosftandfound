import { ITEM_STATUS_CLASSES, ITEM_STATUS_LABELS } from '@/lib/constants';
import type { ItemStatus } from '@/types/item';

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${ITEM_STATUS_CLASSES[status]}`}
    >
      {ITEM_STATUS_LABELS[status]}
    </span>
  );
}

