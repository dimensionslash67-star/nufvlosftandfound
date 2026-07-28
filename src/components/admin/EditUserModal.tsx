'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { ManageUser } from './UserTable';

type EditUserForm = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
};

function createFormState(user: ManageUser): EditUserForm {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
  };
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: {
  user: ManageUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: ManageUser) => void;
}) {
  const [formData, setFormData] = useState<EditUserForm>(() => createFormState(user));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(createFormState(user));
    setError('');
    setLoading(false);
  }, [isOpen, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to update user');
      }

      onSuccess(data.user as ManageUser);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
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
      title={`Edit User · ${user.username}`}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">First Name</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) =>
                setFormData((current) => ({ ...current, firstName: event.target.value }))
              }
              placeholder="First name"
              value={formData.firstName}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Last Name</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) =>
                setFormData((current) => ({ ...current, lastName: event.target.value }))
              }
              placeholder="Last name"
              value={formData.lastName}
            />
          </label>

          <label className="space-y-2 text-sm sm:col-span-2">
            <span className="font-medium text-slate-600 dark:text-slate-300">Email</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email address"
              type="email"
              value={formData.email}
            />
          </label>

          <label className="space-y-2 text-sm sm:col-span-2">
            <span className="font-medium text-slate-600 dark:text-slate-300">Username</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) =>
                setFormData((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="Username"
              value={formData.username}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Role</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  role: event.target.value as 'ADMIN' | 'USER',
                }))
              }
              value={formData.role}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>

          <label className="flex items-end rounded-lg border border-slate-300 px-4 py-3 text-sm dark:border-[#334155] dark:bg-[#0f172a]">
            <span className="flex items-center gap-3 font-medium text-slate-600 dark:text-slate-300">
              <input
                checked={formData.isActive}
                className="h-4 w-4 rounded border-slate-400"
                onChange={(event) =>
                  setFormData((current) => ({ ...current, isActive: event.target.checked }))
                }
                type="checkbox"
              />
              Active account
            </span>
          </label>
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
          <Button disabled={loading} type="submit">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
