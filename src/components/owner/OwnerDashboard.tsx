'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { OWNER_EMAIL } from '@/lib/owner';
import { formatDisplayDate, formatItemCode } from '@/lib/utils';

type DbStats = {
  totalItems: number;
  totalUsers: number;
  totalClaims: number;
  totalAuditLogs: number;
  available: number;
  claimed: number;
  disposed: number;
  lastItem: { itemCode?: string | null; createdAt: string } | null;
  lastUser: { email: string; createdAt: string } | null;
};

type StorageStats = {
  totalSize: string;
  percentUsed: number;
  warning: boolean;
  tables: Array<{ tableName: string; totalSize: string; rowCount: number }>;
};

type ActivityLog = {
  id: string;
  action: string;
  details?: unknown;
  createdAt: string;
  user?: {
    email: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

type DangerInfo = {
  disposedCount: number;
  oldAuditLogsCount: number;
  nextItemCode: string;
};

type Notice = { type: 'success' | 'error'; message: string } | null;
type DangerAction = 'disposed' | 'audit' | 'sequence' | null;
type DownloadKind = 'json' | 'items' | 'users' | null;

const dangerMeta = {
  disposed: {
    title: 'Clear All Disposed Items',
    endpoint: '/api/owner/danger/clear-disposed',
    buttonLabel: 'Delete Disposed Items',
  },
  audit: {
    title: 'Clear Audit Logs Older Than 90 Days',
    endpoint: '/api/owner/danger/clear-audit-logs',
    buttonLabel: 'Delete Old Audit Logs',
  },
  sequence: {
    title: 'Reset Item Code Sequence',
    endpoint: '/api/owner/danger/reset-item-sequence',
    buttonLabel: 'Sync Item Code Sequence',
  },
} as const;

function detailsText(value: unknown) {
  if (!value) return 'No details';
  if (typeof value === 'string') return value;
  try {
    const text = JSON.stringify(value);
    return text.length > 120 ? `${text.slice(0, 120)}...` : text;
  } catch {
    return 'Unable to render details';
  }
}

function actionTone(action: string) {
  const upper = action.toUpperCase();
  if (upper.includes('CREATE')) return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200';
  if (upper.includes('UPDATE') || upper.includes('CLAIM') || upper.includes('RESET')) {
    return 'border-sky-500/30 bg-sky-500/15 text-sky-200';
  }
  if (upper.includes('DELETE') || upper.includes('CLEAR') || upper.includes('DISPOSE')) {
    return 'border-rose-500/30 bg-rose-500/15 text-rose-200';
  }
  return 'border-slate-500/30 bg-slate-500/15 text-slate-200';
}

function fileNameFromDisposition(value: string | null, fallback: string) {
  const match = value?.match(/filename=\"?([^\"]+)\"?/i);
  return match?.[1] ?? fallback;
}

export function OwnerDashboard({
  ownerEmail,
  ownerName,
  pinVerified,
}: {
  ownerEmail: string;
  ownerName: string;
  pinVerified: boolean;
}) {
  const [hasPinAccess, setHasPinAccess] = useState(pinVerified);
  const [stats, setStats] = useState<DbStats | null>(null);
  const [storage, setStorage] = useState<StorageStats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [danger, setDanger] = useState<DangerInfo>({
    disposedCount: 0,
    oldAuditLogsCount: 0,
    nextItemCode: 'ITEM-XXXX-0000',
  });
  const [loading, setLoading] = useState(pinVerified);
  const [notice, setNotice] = useState<Notice>(null);
  const [downloadKind, setDownloadKind] = useState<DownloadKind>(null);
  const [dangerAction, setDangerAction] = useState<DangerAction>(null);
  const [dangerLoading, setDangerLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinFormLoading, setPinFormLoading] = useState(false);

  const lockOwnerConsole = useCallback((message = 'Owner PIN required. Enter your PIN to continue.') => {
    setHasPinAccess(false);
    setLoading(false);
    setDownloadKind(null);
    setDangerLoading(false);
    setDangerAction(null);
    setConfirmText('');
    setNotice({ type: 'error', message });
  }, []);

  const ensureOwnerResponse = useCallback(
    (response: Response, fallbackMessage: string) => {
      if (response.status === 403) {
        window.location.href = '/login';
        throw new Error('UNAUTHORIZED');
      }
      if (response.status === 423) {
        lockOwnerConsole();
        throw new Error('PIN_REQUIRED');
      }
      if (!response.ok) {
        throw new Error(fallbackMessage);
      }
      return response;
    },
    [lockOwnerConsole],
  );

  const fetchJson = useCallback(
    async <T,>(url: string, fallbackMessage: string) => {
      const response = await fetch(url, { cache: 'no-store' });
      ensureOwnerResponse(response, fallbackMessage);
      return (await response.json()) as T;
    },
    [ensureOwnerResponse],
  );

  const refreshData = useCallback(async () => {
    if (!hasPinAccess) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [dbStats, storageStats, activity, disposedMeta, auditMeta, sequenceMeta] =
        await Promise.all([
          fetchJson<DbStats>('/api/owner/db-stats', 'Unable to load database stats.'),
          fetchJson<StorageStats>('/api/owner/storage-stats', 'Unable to load storage stats.'),
          fetchJson<{ logs: ActivityLog[] }>('/api/owner/recent-activity', 'Unable to load recent activity.'),
          fetchJson<{ count: number }>('/api/owner/danger/clear-disposed', 'Unable to load disposed item count.'),
          fetchJson<{ count: number }>('/api/owner/danger/clear-audit-logs', 'Unable to load audit log count.'),
          fetchJson<{ nextItemCode: string }>('/api/owner/danger/reset-item-sequence', 'Unable to load item sequence preview.'),
        ]);

      setStats(dbStats);
      setStorage(storageStats);
      setLogs(activity.logs);
      setDanger({
        disposedCount: disposedMeta.count,
        oldAuditLogsCount: auditMeta.count,
        nextItemCode: sequenceMeta.nextItemCode,
      });
    } catch (error) {
      if (error instanceof Error && (error.message === 'PIN_REQUIRED' || error.message === 'UNAUTHORIZED')) return;
      console.error('Owner console load error:', error);
      setNotice({ type: 'error', message: 'Unable to load owner console data.' });
    } finally {
      setLoading(false);
    }
  }, [fetchJson, hasPinAccess]);

  useEffect(() => {
    const stored = window.localStorage.getItem('owner-last-backup-at');
    if (stored) setLastBackupAt(stored);
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handlePinVerify = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPinLoading(true);

    try {
      const response = await fetch('/api/owner/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (response.status === 403) {
        window.location.href = '/login';
        return;
      }
      if (!response.ok) throw new Error(data.message ?? 'Unable to verify owner PIN.');
      setPinInput('');
      setHasPinAccess(true);
      setNotice({ type: 'success', message: 'Owner PIN verified.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to verify owner PIN.',
      });
    } finally {
      setPinLoading(false);
    }
  }, [pinInput]);

  const handlePinChange = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPinFormLoading(true);

    try {
      const response = await fetch('/api/owner/pin/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pinForm),
      });

      if (response.status === 403) {
        window.location.href = '/login';
        return;
      }
      if (response.status === 423) {
        lockOwnerConsole();
        return;
      }

      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? 'Unable to update owner PIN.');
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      setNotice({ type: 'success', message: data.message ?? 'Owner PIN updated successfully.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to update owner PIN.',
      });
    } finally {
      setPinFormLoading(false);
    }
  }, [lockOwnerConsole, pinForm]);

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
      ensureOwnerResponse(response, 'Download failed.');

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
      window.localStorage.setItem('owner-last-backup-at', backupTime);
      setLastBackupAt(backupTime);
      setNotice({ type: 'success', message: 'Backup downloaded successfully.' });
    } catch (error) {
      if (error instanceof Error && (error.message === 'PIN_REQUIRED' || error.message === 'UNAUTHORIZED')) return;
      console.error('Backup download error:', error);
      setNotice({ type: 'error', message: 'Unable to download backup.' });
    } finally {
      setDownloadKind(null);
    }
  }, [ensureOwnerResponse]);

  const runDangerAction = useCallback(async () => {
    if (!dangerAction) return;
    setDangerLoading(true);

    try {
      const response = await fetch(dangerMeta[dangerAction].endpoint, { method: 'POST' });
      ensureOwnerResponse(response, 'Danger action failed.');
      const data = (await response.json()) as { message?: string };
      setNotice({ type: 'success', message: data.message ?? 'Danger action completed.' });
      setDangerAction(null);
      setConfirmText('');
      await refreshData();
    } catch (error) {
      if (error instanceof Error && (error.message === 'PIN_REQUIRED' || error.message === 'UNAUTHORIZED')) return;
      console.error('Danger action error:', error);
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Danger action failed.',
      });
    } finally {
      setDangerLoading(false);
    }
  }, [dangerAction, ensureOwnerResponse, refreshData]);

  if (!hasPinAccess) {
    return (
      <PinGate
        notice={notice}
        ownerEmail={ownerEmail}
        ownerName={ownerName}
        pinInput={pinInput}
        pinLoading={pinLoading}
        setPinInput={setPinInput}
        onSubmit={handlePinVerify}
      />
    );
  }

  return (
    <>
      <MainConsole
        danger={danger}
        dangerAction={dangerAction}
        dangerLoading={dangerLoading}
        downloadBackup={downloadBackup}
        downloadKind={downloadKind}
        handlePinChange={handlePinChange}
        lastBackupAt={lastBackupAt}
        loading={loading}
        logs={logs}
        notice={notice}
        ownerEmail={ownerEmail}
        ownerName={ownerName}
        pinForm={pinForm}
        pinFormLoading={pinFormLoading}
        refreshStats={stats}
        setDangerAction={setDangerAction}
        setPinForm={setPinForm}
        storage={storage}
      />
      <Modal
        contentClassName="max-w-lg border border-[#334155] bg-[#1e293b]"
        onOpenChange={(open) => {
          if (!open) {
            setDangerAction(null);
            setConfirmText('');
          }
        }}
        open={Boolean(dangerAction)}
        title={dangerAction ? dangerMeta[dangerAction].title : 'Danger Action'}
      >
        {dangerAction ? (
          <div className="space-y-5 text-sm text-slate-300">
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-200">
              {dangerAction === 'disposed'
                ? `${danger.disposedCount} disposed item(s) will be removed permanently.`
                : dangerAction === 'audit'
                  ? `${danger.oldAuditLogsCount} audit log(s) older than 90 days will be removed permanently.`
                  : `The next generated item code will remain synchronized with ${danger.nextItemCode}.`}
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Type CONFIRM to proceed</span>
              <input
                className="w-full rounded-xl border border-[#334155] bg-[#0f172a] px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="CONFIRM"
                value={confirmText}
              />
            </label>
            <div className="flex justify-end gap-3">
              <Button className="border-[#334155] bg-transparent text-slate-200 hover:border-slate-500 hover:bg-[#0f172a]" onClick={() => { setDangerAction(null); setConfirmText(''); }} type="button" variant="outline">Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700" disabled={confirmText !== 'CONFIRM' || dangerLoading} onClick={() => void runDangerAction()} type="button" variant="danger">
                {dangerLoading ? 'Processing...' : dangerMeta[dangerAction].buttonLabel}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function PinGate({
  notice,
  ownerEmail,
  ownerName,
  pinInput,
  pinLoading,
  setPinInput,
  onSubmit,
}: {
  notice: Notice;
  ownerEmail: string;
  ownerName: string;
  pinInput: string;
  pinLoading: boolean;
  setPinInput: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen max-w-[560px] flex-col justify-center px-4 py-10">
        <div className="mb-6 flex justify-end">
          <Link className="inline-flex items-center justify-center rounded-xl border border-[#334155] bg-[#1e293b] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:bg-[#273449]" href="/dashboard">
            Return to Dashboard
          </Link>
        </div>
        <div className="rounded-3xl border border-[#334155] bg-[#111c33] p-8 shadow-[0_24px_64px_rgba(2,6,23,0.45)]">
          <span className="inline-flex rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">
            Private Access
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Owner Console</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Signed in as {ownerName || ownerEmail}. Enter the owner PIN to open the
            database console for {OWNER_EMAIL}.
          </p>
          {notice ? (
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200' : 'border-rose-500/30 bg-rose-500/15 text-rose-200'}`}>
              {notice.message}
            </div>
          ) : null}
          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Owner PIN</span>
              <input
                className="w-full rounded-xl border border-[#334155] bg-[#0f172a] px-4 py-3 text-lg tracking-[0.4em] text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => setPinInput(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                type="password"
                value={pinInput}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link className="inline-flex items-center justify-center rounded-xl border border-[#334155] bg-[#1e293b] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:bg-[#273449]" href="/dashboard">
                Return to Dashboard
              </Link>
              <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={pinInput.length !== 4 || pinLoading} type="submit">
                {pinLoading ? 'Verifying...' : 'Enter Owner Console'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DangerCard({
  actionLabel,
  description,
  onClick,
}: {
  actionLabel: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-[#0f172a] p-5">
      <p className="text-base font-semibold text-white">{actionLabel}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <button className="mt-4 inline-flex rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700" onClick={onClick} type="button">
        Open Confirmation
      </button>
    </div>
  );
}

function MainConsole({
  danger,
  downloadBackup,
  downloadKind,
  handlePinChange,
  lastBackupAt,
  loading,
  logs,
  notice,
  ownerEmail,
  ownerName,
  pinForm,
  pinFormLoading,
  refreshStats,
  setDangerAction,
  setPinForm,
  storage,
}: any) {
  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9]">
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-[#334155] bg-[#111c33] px-6 py-5 shadow-[0_24px_64px_rgba(2,6,23,0.45)] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Owner Console</h1>
            <p className="mt-2 text-sm text-slate-300">Database Management | {OWNER_EMAIL}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">Private Access</span>
              <span className="text-sm text-slate-400">Signed in as {ownerName || ownerEmail}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link className="inline-flex items-center justify-center rounded-xl border border-[#334155] bg-[#1e293b] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:bg-[#273449]" href="/api/owner/pin/logout">
              Return to Dashboard
            </Link>
            <Link className="inline-flex items-center justify-center rounded-xl border border-[#334155] bg-[#1e293b] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:bg-[#273449]" href="/api/auth/logout">
              Logout
            </Link>
          </div>
        </header>

        {notice ? (
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200' : 'border-rose-500/30 bg-rose-500/15 text-rose-200'}`}>{notice.message}</div>
        ) : null}

        <div className="space-y-6">
          <section className="rounded-3xl border border-[#334155] bg-[#1e293b] p-6 shadow-[0_18px_48px_rgba(2,6,23,0.35)]">
            <h2 className="text-xl font-semibold text-white">Database Overview</h2>
            <p className="mt-1 text-sm text-slate-400">Live counts and latest records from Neon.</p>
            {loading || !refreshStats ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-[#0f172a]" />)}</div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Total Items', refreshStats.totalItems],
                    ['Total Users', refreshStats.totalUsers],
                    ['Total Claims', refreshStats.totalClaims],
                    ['Total Audit Logs', refreshStats.totalAuditLogs],
                  ].map(([label, value]) => (
                    <article key={label} className="rounded-2xl border border-[#334155] bg-[#0f172a] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                      <p className="mt-3 text-4xl font-extrabold text-white">{value}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-[#334155] bg-[#0f172a] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Status Breakdown</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-200"><p className="text-xs font-semibold uppercase tracking-[0.16em]">Available</p><p className="mt-2 text-3xl font-bold text-white">{refreshStats.available}</p></div>
                      <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sky-200"><p className="text-xs font-semibold uppercase tracking-[0.16em]">Claimed</p><p className="mt-2 text-3xl font-bold text-white">{refreshStats.claimed}</p></div>
                      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200"><p className="text-xs font-semibold uppercase tracking-[0.16em]">Disposed</p><p className="mt-2 text-3xl font-bold text-white">{refreshStats.disposed}</p></div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#334155] bg-[#0f172a] p-5 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Latest Records</p>
                    <div className="mt-4 space-y-4">
                      <div><p className="text-slate-400">Last item added</p><p className="mt-1 font-semibold text-white">{refreshStats.lastItem ? `${formatItemCode(refreshStats.lastItem.itemCode)} | ${formatDisplayDate(refreshStats.lastItem.createdAt, 'MMM d, yyyy h:mm a')}` : 'No items yet'}</p></div>
                      <div><p className="text-slate-400">Last user added</p><p className="mt-1 font-semibold text-white">{refreshStats.lastUser ? `${refreshStats.lastUser.email} | ${formatDisplayDate(refreshStats.lastUser.createdAt, 'MMM d, yyyy h:mm a')}` : 'No users yet'}</p></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="rounded-3xl border border-[#334155] bg-[#1e293b] p-6 shadow-[0_18px_48px_rgba(2,6,23,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-xl font-semibold text-white">Neon Storage Usage</h2><p className="mt-1 text-sm text-slate-400">Database size and per-table footprint.</p></div>
              {storage?.warning ? <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Over 80% of free tier</span> : null}
            </div>
            {loading || !storage ? (
              <div className="mt-5 h-40 animate-pulse rounded-2xl bg-[#0f172a]" />
            ) : (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-[#334155] bg-[#0f172a] p-5">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total database size</p><p className="mt-2 text-4xl font-extrabold text-white">{storage.totalSize}</p></div>
                    <p className="text-sm text-slate-400">{storage.percentUsed}% of 512 MB</p>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#1e293b]"><div className={`h-full rounded-full ${storage.warning ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${Math.max(3, storage.percentUsed)}%` }} /></div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-[#334155] bg-[#0f172a]"><div className="overflow-x-auto"><table className="min-w-full"><thead className="bg-[#0a1628] text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-300"><tr><th className="px-4 py-3">Table</th><th className="px-4 py-3">Rows</th><th className="px-4 py-3">Size</th></tr></thead><tbody className="divide-y divide-[#334155]">{storage.tables.map((table: any) => <tr key={table.tableName} className="text-sm text-slate-200 hover:bg-[#162238]"><td className="px-4 py-3 font-medium text-white">{table.tableName}</td><td className="px-4 py-3">{table.rowCount.toLocaleString()}</td><td className="px-4 py-3">{table.totalSize}</td></tr>)}</tbody></table></div></div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-[#334155] bg-[#1e293b] p-6 shadow-[0_18px_48px_rgba(2,6,23,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-xl font-semibold text-white">Database Backup</h2><p className="mt-1 text-sm text-slate-400">Download owner-only JSON and CSV exports.</p></div>
              <p className="text-sm text-slate-400">Last backup: {lastBackupAt ? formatDisplayDate(lastBackupAt, 'MMM d, yyyy h:mm a') : 'Never'}</p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <button className="rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-4 py-3 text-sm font-semibold text-indigo-100 transition hover:border-indigo-400 hover:bg-indigo-500/25 disabled:opacity-60" disabled={downloadKind !== null} onClick={() => void downloadBackup('json')} type="button">{downloadKind === 'json' ? 'Downloading...' : 'Download Full Backup (JSON)'}</button>
              <button className="rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-4 py-3 text-sm font-semibold text-indigo-100 transition hover:border-indigo-400 hover:bg-indigo-500/25 disabled:opacity-60" disabled={downloadKind !== null} onClick={() => void downloadBackup('items')} type="button">{downloadKind === 'items' ? 'Downloading...' : 'Download Items CSV'}</button>
              <button className="rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-4 py-3 text-sm font-semibold text-indigo-100 transition hover:border-indigo-400 hover:bg-indigo-500/25 disabled:opacity-60" disabled={downloadKind !== null} onClick={() => void downloadBackup('users')} type="button">{downloadKind === 'users' ? 'Downloading...' : 'Download Users CSV'}</button>
            </div>
          </section>

          <section className="rounded-3xl border border-[#334155] bg-[#1e293b] p-6 shadow-[0_18px_48px_rgba(2,6,23,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-xl font-semibold text-white">Access Security</h2><p className="mt-1 text-sm text-slate-400">Change the 4-digit owner PIN required to enter this console.</p></div>
              <span className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">PIN required on every new entry</span>
            </div>
            <form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={handlePinChange}>
              {[
                ['Current PIN', 'currentPin', 'Current PIN'],
                ['New PIN', 'newPin', 'New PIN'],
                ['Confirm New PIN', 'confirmPin', 'Confirm PIN'],
              ].map(([label, key, placeholder]) => (
                <label key={key} className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">{label}</span>
                  <input className="w-full rounded-xl border border-[#334155] bg-[#0f172a] px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" inputMode="numeric" maxLength={4} onChange={(event) => setPinForm((current: any) => ({ ...current, [key]: event.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder={placeholder} type="password" value={pinForm[key as keyof typeof pinForm]} />
                </label>
              ))}
              <div className="flex justify-end md:col-span-3">
                <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={pinFormLoading || pinForm.currentPin.length !== 4 || pinForm.newPin.length !== 4 || pinForm.confirmPin.length !== 4} type="submit">
                  {pinFormLoading ? 'Updating PIN...' : 'Update Owner PIN'}
                </Button>
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-[#334155] bg-[#1e293b] p-6 shadow-[0_18px_48px_rgba(2,6,23,0.35)]">
            <h2 className="text-xl font-semibold text-white">Recent Activity Log</h2>
            <p className="mt-1 text-sm text-slate-400">Latest 20 audit events across the system.</p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#334155] bg-[#0f172a]"><div className="max-h-[420px] overflow-auto"><table className="min-w-full"><thead className="sticky top-0 bg-[#0a1628] text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-300"><tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Details</th></tr></thead><tbody className="divide-y divide-[#334155]">{logs.length === 0 ? <tr><td className="px-4 py-8 text-center text-sm text-slate-400" colSpan={4}>No recent audit activity found.</td></tr> : logs.map((log: any) => <tr key={log.id} className="text-sm text-slate-200 hover:bg-[#162238]"><td className="whitespace-nowrap px-4 py-3 text-slate-300">{formatDisplayDate(log.createdAt, 'MMM d, yyyy h:mm a')}</td><td className="px-4 py-3"><p className="font-medium text-white">{log.user?.firstName || log.user?.lastName ? [log.user?.firstName, log.user?.lastName].filter(Boolean).join(' ') : log.user?.username ?? 'System'}</p><p className="text-xs text-slate-400">{log.user?.email ?? 'Unknown user'}</p></td><td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${actionTone(log.action)}`}>{log.action}</span></td><td className="px-4 py-3 text-slate-300">{detailsText(log.details)}</td></tr>)}</tbody></table></div></div>
          </section>

          <section className="rounded-3xl border border-rose-500/25 bg-[#1e293b] p-6 shadow-[0_18px_48px_rgba(2,6,23,0.35)]">
            <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
            <p className="mt-1 text-sm text-slate-400">Destructive maintenance actions. Type CONFIRM before proceeding.</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <DangerCard actionLabel="Clear All Disposed Items" description={`${danger.disposedCount} disposed item(s) will be deleted.`} onClick={() => setDangerAction('disposed')} />
              <DangerCard actionLabel="Clear Audit Logs Older Than 90 Days" description={`${danger.oldAuditLogsCount} old audit log(s) are eligible for deletion.`} onClick={() => setDangerAction('audit')} />
              <DangerCard actionLabel="Reset Item Code Sequence" description={`Next generated item code: ${danger.nextItemCode}`} onClick={() => setDangerAction('sequence')} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
