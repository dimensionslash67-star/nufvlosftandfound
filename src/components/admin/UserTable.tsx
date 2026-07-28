'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDisplayDate, getUserDisplayName } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { BulkDeleteUsersModal, type BulkDeactivateUserResult } from './BulkDeleteUsersModal';
import { EditUserModal } from './EditUserModal';

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
  const router = useRouter();
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [users, setUsers] = useState(initialUsers);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
  const [editingUser, setEditingUser] = useState<ManageUser | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    setUsers(initialUsers);
    setSelectedIds(new Set());
  }, [initialUsers]);

  useEffect(() => {
    if (!selectAllRef.current) {
      return;
    }

    selectAllRef.current.indeterminate = selectedIds.size > 0 && selectedIds.size < users.length;
  }, [selectedIds, users.length]);

  const selectedUsers = users.filter((user) => selectedIds.has(user.id));
  const allSelected = users.length > 0 && selectedIds.size === users.length;

  const toggleRow = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(users.map((user) => user.id)));
  };

  const updateUserInState = (updatedUser: ManageUser) => {
    setUsers((current) =>
      current.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
    );
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(updatedUser.id);
      return next;
    });
    router.refresh();
  };

  const applyBulkDeleteResults = (results: BulkDeactivateUserResult[]) => {
    const resultMap = new Map(results.map((result) => [result.id, result]));

    setUsers((current) =>
      current.map((user) => {
        const outcome = resultMap.get(user.id);
        if (!outcome) {
          return user;
        }

        return {
          ...user,
          isActive: outcome.isActive,
        };
      }),
    );
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
    router.refresh();
  };

  const toggleUserActive = async (user: ManageUser) => {
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        id: user.id,
        isActive: !user.isActive,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      window.alert(data.message ?? 'Unable to update user.');
      return;
    }

    updateUserInState(data.user);
  };

  const createUser = async () => {
    setCreateError(null);

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(createForm),
    });

    const data = await response.json();

    if (!response.ok) {
      setCreateError(data.message ?? 'Unable to create user.');
      return;
    }

    setUsers((current) => [data.user, ...current]);
    setIsCreateModalOpen(false);
    setCreateForm({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'USER',
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-red-200">
            {selectedIds.size} user{selectedIds.size === 1 ? '' : 's'} selected
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedIds(new Set())}
              type="button"
              variant="outline"
            >
              Clear Selection
            </Button>
            <Button
              onClick={() => setBulkDeleteOpen(true)}
              type="button"
              variant="danger"
            >
              Deactivate Selected
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Modal
          onOpenChange={setIsCreateModalOpen}
          open={isCreateModalOpen}
          title="Create User"
          trigger={<Button type="button">Create User</Button>}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, firstName: event.target.value }))
              }
              placeholder="First Name"
              value={createForm.firstName}
            />
            <input
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, lastName: event.target.value }))
              }
              placeholder="Last Name"
              value={createForm.lastName}
            />
            <input
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="Username"
              value={createForm.username}
            />
            <input
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="Email"
              type="email"
              value={createForm.email}
            />
            <input
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, password: event.target.value }))
              }
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
            <Button onClick={() => setIsCreateModalOpen(false)} type="button" variant="outline">
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
          <thead className="bg-brand-navy text-white dark:bg-[#0a1628]">
            <tr className="bg-brand-navy text-left text-xs font-semibold uppercase tracking-[0.2em] text-white dark:bg-[#0a1628]">
              <th className="w-12 px-5 py-4">
                <input
                  ref={selectAllRef}
                  checked={allSelected}
                  className="h-4 w-4 rounded border-slate-400"
                  onChange={toggleAll}
                  type="checkbox"
                  aria-label="Select all users"
                />
              </th>
              <th className="px-5 py-4">Username</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Created</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-700 dark:divide-[#334155] dark:text-slate-200">
            {users.map((user) => (
              <tr
                key={user.id}
                className="bg-white transition-colors hover:bg-slate-50 dark:bg-[#1e293b] dark:hover:bg-[#0f172a]"
              >
                <td className="px-5 py-4">
                  <input
                    checked={selectedIds.has(user.id)}
                    className="h-4 w-4 rounded border-slate-400"
                    onChange={() => toggleRow(user.id)}
                    type="checkbox"
                    aria-label={`Select ${user.username}`}
                  />
                </td>
                <td className="px-5 py-4 font-semibold text-slate-900 dark:text-[#f1f5f9]">
                  {user.username}
                </td>
                <td className="px-5 py-4">{getUserDisplayName(user)}</td>
                <td className="px-5 py-4">{user.email}</td>
                <td className="px-5 py-4">{user.role}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      user.isActive
                        ? 'border border-green-300 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-200'
                        : 'border border-red-300 bg-red-100 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-200'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-5 py-4">{formatDisplayDate(user.createdAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setEditingUser(user)}
                      type="button"
                      variant="outline"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => toggleUserActive(user)}
                      type="button"
                      variant="outline"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
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

      {editingUser ? (
        <EditUserModal
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          onSuccess={(updatedUser) => updateUserInState(updatedUser)}
          user={editingUser}
        />
      ) : null}

      <BulkDeleteUsersModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onSuccess={applyBulkDeleteResults}
        users={selectedUsers}
      />
    </div>
  );
}
