import { ReportGenerator } from '@/components/admin/ReportGenerator';
import { getReportPreviewData } from '@/lib/admin';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const type = ((Array.isArray(params.type) ? params.type[0] : params.type) ?? 'items') as 'items' | 'users' | 'audit';
  const page = Number((Array.isArray(params.page) ? params.page[0] : params.page) ?? '1');
  const dateFrom = Array.isArray(params.dateFrom) ? params.dateFrom[0] : params.dateFrom;
  const dateTo = Array.isArray(params.dateTo) ? params.dateTo[0] : params.dateTo;
  const preview = await getReportPreviewData({ type, page, dateFrom, dateTo });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Reports</h2>
        <p className="text-sm text-slate-500">Preview data by range and export a CSV report.</p>
      </div>

      <ReportGenerator
        columns={preview.columns}
        dateFrom={dateFrom}
        dateTo={dateTo}
        rows={preview.rows as Array<Record<string, unknown>>}
        type={type}
      />
    </div>
  );
}
