import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { Pagination } from '@/components/ui/Pagination';
import { getAuditLogsPageData } from '@/lib/admin';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number((Array.isArray(params.page) ? params.page[0] : params.page) ?? '1');
  const search = Array.isArray(params.search) ? params.search[0] : params.search;
  const action = Array.isArray(params.action) ? params.action[0] : params.action;
  const dateFrom = Array.isArray(params.dateFrom) ? params.dateFrom[0] : params.dateFrom;
  const dateTo = Array.isArray(params.dateTo) ? params.dateTo[0] : params.dateTo;
  const { logs, pagination } = await getAuditLogsPageData({ page, search, action, dateFrom, dateTo });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Audit Logs</h2>
        <p className="text-sm text-slate-500">Filter system activity by action, date, or user.</p>
      </div>

      <form className="grid gap-4 rounded-lg bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
        <input className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm" defaultValue={search} name="search" placeholder="Search user or entity..." type="search" />
        <input className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm" defaultValue={action} name="action" placeholder="Action type" type="text" />
        <input className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm" defaultValue={dateFrom} name="dateFrom" type="date" />
        <input className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm" defaultValue={dateTo} name="dateTo" type="date" />
        <button className="rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white" type="submit">
          Apply
        </button>
      </form>

      <AuditLogTable logs={logs} />

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        pathname="/admin/audit-logs"
        query={{ search, action, dateFrom, dateTo }}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
      />
    </div>
  );
}
