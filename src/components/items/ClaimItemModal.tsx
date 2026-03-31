'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

type ClaimableItem = {
  id: string;
  itemCode?: string | null;
  itemName: string;
};

const initialForm = {
  claimerName: '',
  claimerEmail: '',
  claimerPhone: '',
  claimerIdNumber: '',
  relationshipToItem: '',
  verificationNotes: '',
};

export function ClaimItemModal({
  item,
  open,
  onOpenChange,
  onSuccess,
}: {
  item: ClaimableItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (!open) {
      setError(null);
      setFormData(initialForm);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!item) {
      return;
    }

    if (!formData.claimerName || !formData.claimerEmail || !formData.claimerIdNumber) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/items/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          claimData: formData,
        }),
      });
      const data = await response.json().catch(() => ({ message: 'Failed to claim item.' }));

      if (!response.ok) {
        throw new Error(data.message ?? 'Failed to claim item.');
      }

      onSuccess();
      onOpenChange(false);
    } catch (submitError) {
      console.error('Claim item error:', submitError);
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to claim item. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      contentClassName="max-w-2xl dark:border dark:border-[#334155]"
      onOpenChange={onOpenChange}
      open={open}
      title={`Claim Item${item?.itemCode ? `: ${item.itemCode}` : ''}`}
    >
      {item ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Item: <strong className="text-slate-900 dark:text-[#f1f5f9]">{item.itemName}</strong>
          </p>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              error={!formData.claimerName && error ? 'Required' : undefined}
              label="Claimer Full Name"
              onChange={(event) =>
                setFormData((current) => ({ ...current, claimerName: event.target.value }))
              }
              required
              value={formData.claimerName}
            />
            <Input
              error={!formData.claimerEmail && error ? 'Required' : undefined}
              label="Email Address"
              onChange={(event) =>
                setFormData((current) => ({ ...current, claimerEmail: event.target.value }))
              }
              required
              type="email"
              value={formData.claimerEmail}
            />
            <Input
              label="Phone Number"
              onChange={(event) =>
                setFormData((current) => ({ ...current, claimerPhone: event.target.value }))
              }
              type="tel"
              value={formData.claimerPhone}
            />
            <Input
              error={!formData.claimerIdNumber && error ? 'Required' : undefined}
              label="Valid ID Number"
              onChange={(event) =>
                setFormData((current) => ({ ...current, claimerIdNumber: event.target.value }))
              }
              required
              value={formData.claimerIdNumber}
            />
          </div>

          <Input
            label="Relationship to Item"
            onChange={(event) =>
              setFormData((current) => ({ ...current, relationshipToItem: event.target.value }))
            }
            value={formData.relationshipToItem}
          />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Verification Notes
            </span>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
              onChange={(event) =>
                setFormData((current) => ({ ...current, verificationNotes: event.target.value }))
              }
              rows={4}
              value={formData.verificationNotes}
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={loading} type="submit">
              {loading ? 'Processing...' : 'Confirm Claim'}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
