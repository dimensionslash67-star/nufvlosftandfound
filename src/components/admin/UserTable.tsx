'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatDisplayDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';

export type ManageUser = {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function UserTable({ initialUsers }: { initialUsers: ManageUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<{
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'USER';
  }>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'USER',
  });

  const updateUser = async (payload: Record<string, unknown>) => {
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      window.alert(data.message ?? 'Unable to update user.');
      return;
    }

    setUsers((current) => current.map((user) => (user.id === data.user.id ? data.user : user)));
  };

  const deactivateUser = async (id: string) => {
    const response = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();

    if (!response.ok) {
      window.alert(data.message ?? 'Unable to deactivate user.');
      return;
    }

    setUsers((current) => current.map((user) => (user.id === data.user.id ? data.user : user)));
  };

  const createUser = async () => {
    setCreateError(null);

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createForm),
    });

    const data = await response.json();

    if (!response.ok) {
      setCreateError(data.message ?? 'Unable to create user.');
      return;
    }

    setUsers((current) => [data.user, ...current]);
    setIsModalOpen(false);
    setCreateForm({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'USER',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Modal
          onOpenChange={setIsModalOpen}
          open={isModalOpen}
          title="Create User"
          trigger={<Button type="button">Create User</Button>}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) => setCreateForm((current) => ({ ...current, firstName: event.target.value }))}
              placeholder="First Name"
              value={createForm.firstName}
            />
            <input
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) => setCreateForm((current) => ({ ...current, lastName: event.target.value }))}
              placeholder="Last Name"
              value={createForm.lastName}
            />
            <input
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) => setCreateForm((current) => ({ ...current, username: event.target.value }))}
              placeholder="Username"
              value={createForm.username}
            />
            <input
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              type="email"
              value={createForm.email}
            />
            <input
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Temporary password"
              type="password"
              value={createForm.password}
            />
            <select
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  role: event.target.value as 'ADMIN' | 'USER',
                }))
              }
              value={createForm.role}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {createError ? <p className="mt-4 text-sm text-red-600">{createError}</p> : null}

          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={() => setIsModalOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button onClick={createUser} type="button">
              Create User
            </Button>
          </div>
        </Modal>
      </div>

      <Table>
        <table className="min-w-full divide-y divide-slate-200 dark:divide-[#334155]">
          <thead className="bg-white dark:bg-[#1e293b]">
            <tr className="bg-white text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:bg-[#1e293b] dark:text-slate-400">
              <th className="px-5 py-4">Username</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Created</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-700 dark:divide-[#334155] dark:text-slate-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-4 font-semibold text-slate-900 dark:text-[#f1f5f9]">{user.username}</td>
                <td className="px-5 py-4">{user.email}</td>
                <td className="px-5 py-4">
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
                    defaultValue={user.role}
                    onChange={(event) =>
                      updateUser({
                        id: user.id,
                        role: event.target.value,
                      })
                    }
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4">{formatDisplayDate(user.createdAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => updateUser({ id: user.id, isActive: !user.isActive })}
                      type="button"
                      variant="outline"
                    >
                      Toggle
                    </Button>
                    <Button onClick={() => deactivateUser(user.id)} type="button" variant="danger">
                      Deactivate
                    </Button>
                    <Link
                      className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-navy hover:text-brand-navy dark:border-[#334155] dark:text-slate-200 dark:hover:border-indigo-300 dark:hover:text-indigo-200"
                      href={`/admin/audit-logs?search=${encodeURIComponent(user.username)}`}
                    >
                      Audit Logs
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Table>
    </div>
  );
}
