'use client';

import { formatDisplayDate } from '@/lib/utils';
import type { Item } from '@/types/item';
import { Modal } from '@/components/ui/Modal';

export function ItemDetailModal({
  item,
  open,
  onOpenChange,
}: {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      contentClassName="max-w-2xl dark:border dark:border-[#334155]"
      onOpenChange={onOpenChange}
      open={open}
      title="Item Details"
    >
      {item ? (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-medium uppercase text-blue-600">Item Code</p>
            <p className="mt-1 text-3xl font-bold text-blue-900">
              {item.itemCode ?? 'ITEM-XXXX-0000'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Item Name</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-[#f1f5f9]">{item.itemName}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Category</p>
              <p className="text-slate-900 dark:text-[#f1f5f9]">{item.category}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</p>
              <p className="text-slate-900 dark:text-[#f1f5f9]">{item.status}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Location Found</p>
            <p className="text-slate-900 dark:text-[#f1f5f9]">{item.location}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Date Reported</p>
            <p className="text-slate-900 dark:text-[#f1f5f9]">{formatDisplayDate(item.dateReported)}</p>
          </div>

          {item.description ? (
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{item.description}</p>
            </div>
          ) : null}

          {item.contactInfo ? (
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Contact Information</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{item.contactInfo}</p>
            </div>
          ) : null}

          {item.reporter ? (
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Reported By</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {item.reporter.username} ({item.reporter.email})
              </p>
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-[#334155] dark:bg-[#0f172a] dark:text-slate-200">
            To claim this item, note the Item Code and visit the Lost &amp; Found Office at the
            Student Discipline Office, 2nd Floor with a valid ID for verification.
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
