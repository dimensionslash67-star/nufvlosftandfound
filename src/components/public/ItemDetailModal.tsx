'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { formatDisplayDate, formatItemCode } from '@/lib/utils';
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
                <div>
                  <Dialog.Title className="text-2xl font-semibold text-slate-900">{item.itemName}</Dialog.Title>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#1e3a8a]">
                    {formatItemCode(item.id)}
                  </p>
                </div>
                <Dialog.Close className="rounded-full p-2 text-slate-500 hover:bg-slate-100">X</Dialog.Close>
              </div>

              <div className="mt-6 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Category</p>
                  <p className="mt-1 text-slate-900">{item.category}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date Found</p>
                  <p className="mt-1 text-slate-900">{formatDisplayDate(item.dateReported)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Location</p>
                  <p className="mt-1 text-slate-900">{item.location}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-900">
                    {item.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[#1e3a8a] p-5 text-white">
                <p className="font-semibold">Next Step</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  Note this item ID and visit the Student Discipline Office for verification and claim processing.
                </p>
              </div>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
