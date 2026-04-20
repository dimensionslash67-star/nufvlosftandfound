'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Item, ItemUserSummary } from '@/types/item';

type DeleteItemModalItem = Pick<Item, 'id' | 'itemCode' | 'itemName' | 'reporterId'> & {
  reporter?: ItemUserSummary;
};

export function DeleteItemModal({
  item,
  open,
  onOpenChange,
  onConfirm,
  loading,
  error,
}: {
  item: DeleteItemModalItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
}) {
  return (
    <Modal
      contentClassName="max-w-xl dark:border dark:border-[#334155]"
      onOpenChange={onOpenChange}
      open={open}
      title="Delete Item"
    >
      {item ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <p className="font-semibold">Warning: this cannot be undone.</p>
            <p className="mt-1">
              This will permanently remove the item from the system and from active listings.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#334155] dark:bg-[#0f172a]">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-slate-500 dark:text-slate-400">Item</dt>
                <dd className="mt-1 font-mono text-slate-900 dark:text-[#f1f5f9]">
                  {item.itemCode ?? item.id.slice(0, 12)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500 dark:text-slate-400">Name</dt>
                <dd className="mt-1 text-slate-900 dark:text-[#f1f5f9]">{item.itemName}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500 dark:text-slate-400">Reported By</dt>
                <dd className="mt-1 text-slate-900 dark:text-[#f1f5f9]">
                  {item.reporter?.username ?? item.reporter?.email ?? item.reporterId}
                </dd>
              </div>
            </dl>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete this item?
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <Button disabled={loading} onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={loading} onClick={onConfirm} type="button" variant="danger">
              {loading ? 'Deleting...' : 'Delete Item'}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
