'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatDisplayDate } from '@/lib/utils';

type StorageStats = {
  totalSize: string;
  percentUsed: number;
  warning: boolean;
  tables: Array<{ tableName: string; totalSize: string; rowCount: number }>;
};

type Notice = { type: 'success' | 'error'; message: string } | null;
type DownloadKind = 'json' | 'items' | 'users' | null;

function fileNameFromDisposition(value: string | null, fallback: string) {
  const match = value?.match(/filename=\"?([^\"]+)\"?/i);
  return match?.[1] ?? fallback;
}

export function OwnerDashboard({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName: string;
}) {
  const [storage, setStorage] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [downloadKind, setDownloadKind] = useState<DownloadKind>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/owner/storage-stats', { cache: 'no-store' });
      const data = (await response.json().catch(() => null)) as StorageStats | null;

      if (!response.ok || !data) {
        throw new Error('Unable to load database storage.');
      }

      setStorage(data);
    } catch (error) {
      console.error('Database page load error:', error);
      setNotice({ type: 'error', message: 'Unable to load database storage.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem('database-last-backup-at');
    if (stored) {
      setLastBackupAt(stored);
    }

    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const downloadBackup = useCallback(async (kind: Exclude<DownloadKind, null>) => {
    setDownloadKind(kind);

    try {
      const target =
        kind === 'json'
          ? { url: '/api/owner/backup/json', name: 'nufv-backup.json' }
          : kind === 'users'
            ? { url: '/api/owner/backup/csv?dataset=users', name: 'nufv-users.csv' }
            : { url: '/api/owner/backup/csv?dataset=items', name: 'nufv-items.csv' };

      const response = await fetch(target.url, { method: 'POST' });

      if (!response.ok) {
        throw new Error('Download failed.');
      }

      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = fileNameFromDisposition(response.headers.get('content-disposition'), target.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);

      const backupTime = new Date().toISOString();
      window.localStorage.setItem('database-last-backup-at', backupTime);
      setLastBackupAt(backupTime);
      setNotice({ type: 'success', message: 'Backup downloaded successfully.' });
    } catch (error) {
      console.error('Database backup download error:', error);
      setNotice({ type: 'error', message: 'Unable to download backup.' });
    } finally {
      setDownloadKind(null);
    }
  }, []);

  const returnToDashboard = useCallback(() => {
    window.location.assign('/dashboard');
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9]">
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-[#334155] bg-[#111c33] px-6 py-5 shadow-[0_24px_64px_rgba(2,6,23,0.45)] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Database</h1>
            <p className="mt-2 text-sm text-slate-300">Storage usage and backup tools.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
                Internal Tools
              </span>
              <span className="text-sm text-slate-400">Signed in as {userName || userEmail}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center justify-center rounded-xl border border-[#334155] bg-[#1e293b] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:bg-[#273449]"
              onClick={returnToDashboard}
              type="button"
            >
              Return to Dashboard
            </button>
            <Link
              className="inline-flex items-center justify-center rounded-xl border border-[#334155] bg-[#1e293b] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:bg-[#273449]"
              href="/api/auth/logout"
              prefetch={false}
            >
              Logout
            </Link>
          </div>
        </header>

        {notice ? (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
              notice.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-500/30 bg-rose-500/15 text-rose-200'
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="space-y-6">
          <section className="rounded-3xl border border-[#334155] bg-[#1e293b] p-6 shadow-[0_18px_48px_rgba(2,6,23,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Neon Storage Usage</h2>
                <p className="mt-1 text-sm text-slate-400">Database size and per-table footprint.</p>
              </div>
              {storage?.warning ? (
                <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                  Over 80% of free tier
                </span>
              ) : null}
            </div>
            {loading || !storage ? (
              <div className="mt-5 h-40 animate-pulse rounded-2xl bg-[#0f172a]" />
            ) : (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-[#334155] bg-[#0f172a] p-5">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Total database size
                      </p>
                      <p className="mt-2 text-4xl font-extrabold text-white">{storage.totalSize}</p>
                    </div>
                    <p className="text-sm text-slate-400">{storage.percentUsed}% of 512 MB</p>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#1e293b]">
                    <div
                      className={`h-full rounded-full ${storage.warning ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.max(3, storage.percentUsed)}%` }}
                    />
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-[#334155] bg-[#0f172a]">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-[#0a1628] text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                        <tr>
                          <th className="px-4 py-3">Table</th>
                          <th className="px-4 py-3">Rows</th>
                          <th className="px-4 py-3">Size</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#334155]">
                        {storage.tables.map((table) => (
                          <tr key={table.tableName} className="text-sm text-slate-200 hover:bg-[#162238]">
                            <td className="px-4 py-3 font-medium text-white">{table.tableName}</td>
                            <td className="px-4 py-3">{table.rowCount.toLocaleString()}</td>
                            <td className="px-4 py-3">{table.totalSize}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-[#334155] bg-[#1e293b] p-6 shadow-[0_18px_48px_rgba(2,6,23,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Database Backup</h2>
                <p className="mt-1 text-sm text-slate-400">Download JSON and CSV exports of the current data.</p>
              </div>
              <p className="text-sm text-slate-400">
                Last backup: {lastBackupAt ? formatDisplayDate(lastBackupAt, 'MMM d, yyyy h:mm a') : 'Never'}
              </p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Button
                className="border border-indigo-500/30 bg-indigo-500/15 text-indigo-100 hover:border-indigo-400 hover:bg-indigo-500/25 disabled:opacity-60"
                disabled={downloadKind !== null}
                onClick={() => void downloadBackup('json')}
                type="button"
              >
                {downloadKind === 'json' ? 'Downloading...' : 'Download Full Backup (JSON)'}
              </Button>
              <Button
                className="border border-indigo-500/30 bg-indigo-500/15 text-indigo-100 hover:border-indigo-400 hover:bg-indigo-500/25 disabled:opacity-60"
                disabled={downloadKind !== null}
                onClick={() => void downloadBackup('items')}
                type="button"
              >
                {downloadKind === 'items' ? 'Downloading...' : 'Download Items CSV'}
              </Button>
              <Button
                className="border border-indigo-500/30 bg-indigo-500/15 text-indigo-100 hover:border-indigo-400 hover:bg-indigo-500/25 disabled:opacity-60"
                disabled={downloadKind !== null}
                onClick={() => void downloadBackup('users')}
                type="button"
              >
                {downloadKind === 'users' ? 'Downloading...' : 'Download Users CSV'}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
