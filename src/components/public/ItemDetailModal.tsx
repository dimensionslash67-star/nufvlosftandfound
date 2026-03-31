'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { formatDisplayDate } from '@/lib/utils';
import type { Item } from '@/types/item';

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
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl">
          {item ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <Dialog.Title className="text-2xl font-semibold text-slate-900">
                  Item Details
                </Dialog.Title>
                <Dialog.Close className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                  X
                </Dialog.Close>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-medium uppercase text-blue-600">Item Code</p>
                  <p className="mt-1 text-3xl font-bold font-mono text-blue-900">
                    {item.itemCode ?? 'ITEM-XXXX-0000'}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Item Name</p>
                    <p className="mt-1 text-lg text-slate-900">{item.itemName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Category</p>
                    <p className="mt-1 text-slate-900">{item.category}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">Location Found</p>
                  <p className="mt-1 text-slate-900">{item.location}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">Date Reported</p>
                  <p className="mt-1 text-slate-900">{formatDisplayDate(item.dateReported)}</p>
                </div>

                {item.description ? (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Description</p>
                    <p className="mt-1 text-sm text-slate-700">{item.description}</p>
                  </div>
                ) : null}

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  <p className="font-semibold">To claim this item:</p>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-blue-700">
                    <li>
                      Note the Item Code: <strong className="font-mono">{item.itemCode ?? 'ITEM-XXXX-0000'}</strong>
                    </li>
                    <li>Visit the Lost &amp; Found Office at the Student Discipline Office, 2nd Floor.</li>
                    <li>Bring a valid ID for verification.</li>
                  </ol>
                </div>
              </div>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
