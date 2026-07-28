'use client';

import { useEffect, useState, type FormEvent } from 'react';
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

type PasswordResetForm = {
  newPassword: string;
  confirmPassword: string;
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

const emptyPasswordForm: PasswordResetForm = {
  newPassword: '',
  confirmPassword: '',
};

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
  const [passwordForm, setPasswordForm] = useState<PasswordResetForm>(emptyPasswordForm);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(createFormState(user));
    setPasswordForm(emptyPasswordForm);
    setShowPasswordSection(false);
    setError('');
    setPasswordError('');
    setPasswordSuccess('');
    setDeactivateError('');
    setLoading(false);
    setPasswordLoading(false);
    setDeactivateLoading(false);
  }, [isOpen, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  const handleResetPassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Temporary password must be at least 8 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Temporary password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to reset password');
      }

      setPasswordForm(emptyPasswordForm);
      setPasswordSuccess(data.message || 'Temporary password updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivateError('');

    if (!formData.isActive) {
      setDeactivateError('This account is already deactivated.');
      return;
    }

    const confirmed = window.confirm(
      'Deactivate this account? The user will immediately lose access, but all records will remain in the database.',
    );

    if (!confirmed) {
      return;
    }

    setDeactivateLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to deactivate user');
      }

      onSuccess(data.user as ManageUser);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate user';
      setDeactivateError(message);
    } finally {
      setDeactivateLoading(false);
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
              onChange={(event) =>
                setFormData((current) => ({ ...current, email: event.target.value }))
              }
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

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#334155] dark:bg-[#0f172a]">
          <button
            className="flex w-full items-center justify-between gap-4 text-left"
            type="button"
            onClick={() => {
              setShowPasswordSection((current) => !current);
              setPasswordError('');
              setPasswordSuccess('');
            }}
          >
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#f1f5f9]">
                Reset Password
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Set a temporary password for this user without exposing it in logs.
              </p>
            </div>
            <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-[#334155] dark:text-slate-300">
              {showPasswordSection ? 'Hide' : 'Show'}
            </span>
          </button>

          {showPasswordSection ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    Temporary Password
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        newPassword: event.target.value,
                      }))
                    }
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    type="password"
                    value={passwordForm.newPassword}
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    Confirm Temporary Password
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    minLength={8}
                    placeholder="Re-enter temporary password"
                    type="password"
                    value={passwordForm.confirmPassword}
                  />
                </label>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Temporary passwords must be at least 8 characters long. They are stored hashed only.
              </p>

              {passwordError ? (
                <div className="rounded-lg border border-red-800 bg-red-950/60 px-4 py-3 text-sm text-red-200">
                  {passwordError}
                </div>
              ) : null}

              {passwordSuccess ? (
                <div className="rounded-lg border border-green-700 bg-green-950/40 px-4 py-3 text-sm text-green-200">
                  {passwordSuccess}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  disabled={passwordLoading}
                  onClick={handleResetPassword}
                  type="button"
                  variant="outline"
                >
                  {passwordLoading ? 'Resetting...' : 'Reset Temporary Password'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">Danger Zone</p>
              <p className="mt-1 text-xs leading-5 text-red-700 dark:text-red-200/80">
                Deactivate this account to block login while preserving the user record and history.
              </p>
            </div>

            <Button
              disabled={deactivateLoading || !formData.isActive}
              onClick={handleDeactivate}
              type="button"
              variant="danger"
            >
              {deactivateLoading
                ? 'Deactivating...'
                : formData.isActive
                  ? 'Deactivate Account'
                  : 'Already Deactivated'}
            </Button>
          </div>

          {deactivateError ? (
            <div className="mt-4 rounded-lg border border-red-800 bg-red-950/60 px-4 py-3 text-sm text-red-200">
              {deactivateError}
            </div>
          ) : null}
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
