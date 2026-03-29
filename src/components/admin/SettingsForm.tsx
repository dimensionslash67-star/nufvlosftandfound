'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type SettingsValues = {
  siteName: string;
  maxFileSize: number;
  retentionDays: number;
  adminEmail: string;
};

export function SettingsForm({ initialSettings }: { initialSettings: SettingsValues }) {
  const [values, setValues] = useState(initialSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const response = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    const data = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setError(data.message ?? 'Unable to save settings.');
      return;
    }

    setValues(data.settings);
    setMessage(data.message ?? 'Settings saved successfully.');
  };

  return (
    <div className="space-y-5 rounded-lg bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Update site-wide configuration values.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Site name</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
            onChange={(event) => setValues((current) => ({ ...current, siteName: event.target.value }))}
            value={values.siteName}
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Max file size</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
            onChange={(event) =>
              setValues((current) => ({ ...current, maxFileSize: Number(event.target.value) || 0 }))
            }
            type="number"
            value={values.maxFileSize}
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Item retention days</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
            onChange={(event) =>
              setValues((current) => ({ ...current, retentionDays: Number(event.target.value) || 0 }))
            }
            type="number"
            value={values.retentionDays}
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Admin email</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
            onChange={(event) => setValues((current) => ({ ...current, adminEmail: event.target.value }))}
            type="email"
            value={values.adminEmail}
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <div className="flex justify-end">
        <Button disabled={isSaving} onClick={saveSettings} type="button">
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
