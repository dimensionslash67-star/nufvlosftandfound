'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { getUserDisplayName } from '@/lib/utils';
import type { ManageUser } from './UserTable';

export type BulkDeleteUserResult = {
  id: string;
  username: string;
  email: string;
  action: 'deleted' | 'deactivated';
  hardDeleted: boolean;
  isActive: boolean;
};

export function BulkDeleteUsersModal({
  users,
  isOpen,
  onClose,
  onSuccess,
}: {
  users: ManageUser[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (results: BulkDeleteUserResult[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userIds: users.map((user) => user.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to delete selected users');
      }

      onSuccess((data.results ?? []) as BulkDeleteUserResult[]);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete selected users';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      contentClassName="max-w-2xl"
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={isOpen}
      title="Delete Selected Users"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          <p className="font-semibold">Confirm user removal</p>
          <p className="mt-1 leading-6">
            Users with related items, claims, or audit history will be deactivated instead of
            permanently deleted to preserve references.
          </p>
        </div>

        <div className="max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white dark:border-[#334155] dark:bg-[#0f172a]">
          <ul className="divide-y divide-slate-200 dark:divide-[#334155]">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-[#f1f5f9]">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-[#334155] dark:text-slate-300">
                  {user.role}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-800 bg-red-950/60 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={loading} onClick={onClose} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={loading} type="button" variant="danger" onClick={handleDelete}>
            {loading ? 'Deleting...' : `Delete ${users.length} User${users.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
