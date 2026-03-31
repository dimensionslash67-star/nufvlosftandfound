'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type SettingsUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  username: string;
};

function getDisplayName(user: SettingsUser) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username;
}

function getPasswordStrength(password: string) {
  if (!password) {
    return { label: 'No password entered', score: 0, width: '0%', color: 'bg-slate-200' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { label: 'Weak', score, width: '25%', color: 'bg-red-500' };
  }

  if (score <= 3) {
    return { label: 'Medium', score, width: '65%', color: 'bg-amber-500' };
  }

  return { label: 'Strong', score, width: '100%', color: 'bg-emerald-500' };
}

export function ProfileSettings({ initialUser }: { initialUser: SettingsUser }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(getDisplayName(initialUser));
  const [email, setEmail] = useState(initialUser.email);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  useEffect(() => {
    const saved = window.localStorage.getItem('nufv-theme');
    const nextTheme = saved === 'dark' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  }, []);

  const applyTheme = (nextTheme: 'light' | 'dark') => {
    setTheme(nextTheme);
    window.localStorage.setItem('nufv-theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileMessage(null);

    const response = await fetch('/api/admin/settings/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName,
        email,
      }),
    });

    const data = await response.json().catch(() => ({ message: 'Unable to update profile.' }));
    setIsSavingProfile(false);

    if (!response.ok) {
      setProfileError(data.message ?? 'Unable to update profile.');
      return;
    }

    setProfileMessage(data.message ?? 'Profile updated.');
    router.refresh();
  };

  const updatePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      setPasswordMessage(null);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      setPasswordMessage(null);
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError(null);
    setPasswordMessage(null);

    const response = await fetch('/api/admin/settings/password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    const data = await response.json().catch(() => ({ message: 'Unable to update password.' }));
    setIsUpdatingPassword(false);

    if (!response.ok) {
      setPasswordError(data.message ?? 'Unable to update password.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage(data.message ?? 'Password updated.');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-[#334155] dark:bg-[#1e293b]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f1f5f9]">Account Information</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Update the public-facing details used across the dashboard.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Display Name"
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Enter your display name"
            value={displayName}
          />
          <Input
            label="Email Address"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email address"
            type="email"
            value={email}
          />
        </div>

        {profileError ? <p className="mt-4 text-sm text-red-600">{profileError}</p> : null}
        {profileMessage ? <p className="mt-4 text-sm text-emerald-600">{profileMessage}</p> : null}
      </section>

      <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-[#334155] dark:bg-[#1e293b]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f1f5f9]">Change Password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose a stronger password to secure your admin account.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="Current Password"
            onChange={(event) => setCurrentPassword(event.target.value)}
            type="password"
            value={currentPassword}
          />
          <div className="space-y-2">
            <Input
              label="New Password"
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              value={newPassword}
            />
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-[#334155]">
                <div className={`h-full ${passwordStrength.color} transition-all`} style={{ width: passwordStrength.width }} />
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Strength: {passwordStrength.label}
              </p>
            </div>
          </div>
          <Input
            label="Confirm Password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            value={confirmPassword}
          />
        </div>

        {passwordError ? <p className="mt-4 text-sm text-red-600">{passwordError}</p> : null}
        {passwordMessage ? <p className="mt-4 text-sm text-emerald-600">{passwordMessage}</p> : null}

        <div className="mt-6 flex justify-end">
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={isUpdatingPassword}
            onClick={updatePassword}
            type="button"
          >
            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </section>

      <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-[#334155] dark:bg-[#1e293b]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f1f5f9]">Appearance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose the dashboard theme that works best for your environment.
          </p>
        </div>

        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 p-5 dark:border-[#334155] dark:bg-[#0f172a] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-[#f1f5f9]">Theme</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Switch between light and dark dashboard surfaces.
            </p>
          </div>

          <button
            aria-label="Toggle theme"
            className={`relative inline-flex h-9 w-20 items-center rounded-full transition ${
              theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
            onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
            type="button"
          >
            <span
              className={`absolute top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-700 shadow transition ${
                theme === 'dark' ? 'left-[calc(100%-2rem)] -translate-x-1' : 'left-1'
              }`}
            >
              {theme === 'dark' ? 'D' : 'L'}
            </span>
            <span className="w-full px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={isSavingProfile}
            onClick={saveProfile}
            type="button"
          >
            {isSavingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </section>
    </div>
  );
}
