'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

type DisposableItem = {
  id: string;
  itemCode?: string | null;
  itemName: string;
};

export function DisposeItemModal({
  item,
  open,
  onOpenChange,
  onSuccess,
}: {
  item: DisposableItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [disposeReason, setDisposeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDisposeReason('');
      setError(null);
    }
  }, [open]);

  const handleDispose = async () => {
    if (!item) {
      return;
    }

    if (!disposeReason.trim()) {
      setError('Please provide a reason for disposal.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DISPOSED',
          disposeReason,
        }),
      });
      const data = await response.json().catch(() => ({ message: 'Failed to dispose item.' }));

      if (!response.ok) {
        throw new Error(data.message ?? 'Failed to dispose item.');
      }

      onSuccess();
      onOpenChange(false);
    } catch (disposeError) {
      console.error('Dispose item error:', disposeError);
      setError(
        disposeError instanceof Error
          ? disposeError.message
          : 'Failed to dispose item. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      contentClassName="max-w-xl dark:border dark:border-[#334155]"
      onOpenChange={onOpenChange}
      open={open}
      title={`Dispose Item${item?.itemCode ? `: ${item.itemCode}` : ''}`}
    >
      {item ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <strong>Warning:</strong> This will mark the item as disposed and remove it from
            active claim listings.
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            Item: <strong className="text-slate-900 dark:text-[#f1f5f9]">{item.itemName}</strong>
          </p>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Reason for Disposal
            </span>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
              onChange={(event) => setDisposeReason(event.target.value)}
              rows={4}
              value={disposeReason}
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={loading} onClick={handleDispose} type="button" variant="danger">
              {loading ? 'Processing...' : 'Confirm Disposal'}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
