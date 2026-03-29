import { formatDisplayDate, getUserDisplayName } from '@/lib/utils';
import { Table } from '@/components/ui/Table';

export type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  details?: unknown;
  createdAt: string | Date;
  user?: {
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};

export function AuditLogTable({
  logs,
}: {
  logs: AuditLogRow[];
}) {
  return (
    <Table>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-[#334155]">
        <thead className="bg-white dark:bg-[#1e293b]">
          <tr className="bg-white text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:bg-[#1e293b] dark:text-slate-400">
            <th className="px-5 py-4">Timestamp</th>
            <th className="px-5 py-4">User</th>
            <th className="px-5 py-4">Action</th>
            <th className="px-5 py-4">Entity</th>
            <th className="px-5 py-4">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm text-slate-700 dark:divide-[#334155] dark:text-slate-200">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-5 py-4">{formatDisplayDate(log.createdAt, 'MMM d, yyyy h:mm a')}</td>
              <td className="px-5 py-4">{getUserDisplayName(log.user)}</td>
              <td className="px-5 py-4 font-semibold text-slate-900 dark:text-[#f1f5f9]">{log.action}</td>
              <td className="px-5 py-4">{log.entityType}</td>
              <td className="px-5 py-4">
                <details className="rounded-lg bg-slate-50 p-3 dark:bg-[#0f172a]">
                  <summary className="cursor-pointer font-medium text-brand-navy dark:text-indigo-300">View JSON</summary>
                  <pre className="mt-3 overflow-x-auto text-xs text-slate-700 dark:text-slate-300">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Table>
  );
}
