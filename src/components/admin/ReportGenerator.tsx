import Link from 'next/link';
import { formatDisplayDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';

export function ReportGenerator({
  type,
  dateFrom,
  dateTo,
  columns,
  rows,
}: {
  type: 'items' | 'users' | 'audit';
  dateFrom?: string;
  dateTo?: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
}) {
  const downloadParams = new URLSearchParams();
  downloadParams.set('type', type);
  if (dateFrom) downloadParams.set('dateFrom', dateFrom);
  if (dateTo) downloadParams.set('dateTo', dateTo);

  return (
    <div className="space-y-5">
      <form className="grid gap-4 rounded-lg bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:grid-cols-[1fr_1fr_1fr_auto]">
        <select className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm" defaultValue={type} name="type">
          <option value="items">Items</option>
          <option value="users">Users</option>
          <option value="audit">Audit Logs</option>
        </select>
        <input className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm" defaultValue={dateFrom} name="dateFrom" type="date" />
        <input className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm" defaultValue={dateTo} name="dateTo" type="date" />
        <Button type="submit">Preview</Button>
      </form>

      <div className="flex justify-end">
        <Link
          className="inline-flex items-center justify-center rounded-lg bg-[#2e7d32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#256729]"
          href={`/api/admin/reports?${downloadParams.toString()}`}
        >
          Generate CSV
        </Link>
      </div>

      <Table>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-white">
            <tr className="bg-white text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {columns.map((column) => (
                <th key={column} className="px-5 py-4">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-slate-500" colSpan={columns.length || 1}>
                  No data in the selected range.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column, valueIndex) => {
                    const value = row[column];

                    return (
                      <td key={valueIndex} className="px-5 py-4">
                        {value instanceof Date || (typeof value === 'string' && value.includes('T'))
                          ? formatDisplayDate(value as string)
                          : typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Table>
    </div>
  );
}
