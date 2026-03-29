'use client';

import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import type { ReportType } from '@/lib/admin';
import { formatDisplayDate } from '@/lib/utils';

type ReportStats = {
  totalItems: number;
  available: number;
  claimed: number;
  disposed: number;
  byDate: { date: string; count: number }[];
  byCategory: { category: string; count: number }[];
};

const STATUS_COLORS = {
  total: '#6366f1',
  available: '#10b981',
  claimed: '#6366f1',
  disposed: '#ef4444',
} as const;

const STAT_CARDS = [
  { key: 'totalItems', label: 'Total Items', accent: STATUS_COLORS.total },
  { key: 'available', label: 'Available Items', accent: STATUS_COLORS.available },
  { key: 'claimed', label: 'Claimed Items', accent: STATUS_COLORS.claimed },
  { key: 'disposed', label: 'Disposed Items', accent: STATUS_COLORS.disposed },
] as const;

export function ReportGenerator({
  type,
  dateFrom,
  dateTo,
  columns,
  rows,
  stats,
}: {
  type: ReportType;
  dateFrom?: string;
  dateTo?: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  stats: ReportStats;
}) {
  const downloadParams = new URLSearchParams();
  downloadParams.set('type', type);
  if (dateFrom) downloadParams.set('dateFrom', dateFrom);
  if (dateTo) downloadParams.set('dateTo', dateTo);

  const pieData = [
    { name: 'Available', value: stats.available, color: STATUS_COLORS.available },
    { name: 'Claimed', value: stats.claimed, color: STATUS_COLORS.claimed },
    { name: 'Disposed', value: stats.disposed, color: STATUS_COLORS.disposed },
  ];

  const dateData = stats.byDate.map((entry) => ({
    ...entry,
    shortDate: new Date(`${entry.date}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <article
            key={card.key}
            className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:bg-[#1e293b]"
          >
            <div className="h-1 w-full" style={{ backgroundColor: card.accent }} />
            <div className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-400">
                {card.label}
              </p>
              <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-[#f1f5f9]">
                {stats[card.key]}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          description="Available, claimed, and disposed item proportions."
          title="Items by Status"
        >
          <div className="relative h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={84}
                  outerRadius={118}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Items']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Total
              </span>
              <span className="mt-1 text-4xl font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                {stats.totalItems}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {pieData.map((entry) => (
              <div key={entry.name} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-[#0f172a]">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{entry.name}</span>
                </div>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-[#f1f5f9]">{entry.value}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          description="Item records created in the last 30 days."
          title="Items Added Over Time"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dateData} margin={{ top: 8, right: 16, left: -12, bottom: 4 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  minTickGap={18}
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                  formatter={(value: number) => [value, 'Items']}
                  labelFormatter={(value) => `Date: ${value}`}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <ChartCard
        description="Compare item volume across categories."
        title="Category Breakdown"
      >
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.byCategory}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 40, bottom: 8 }}
            >
              <defs>
                <linearGradient id="categoryBars" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                allowDecimals={false}
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
                type="number"
              />
              <YAxis
                dataKey="category"
                stroke="#94a3b8"
                tick={{ fill: '#334155', fontSize: 12 }}
                tickLine={false}
                type="category"
                width={110}
              />
              <Tooltip formatter={(value: number) => [value, 'Items']} />
              <Bar dataKey="count" fill="url(#categoryBars)" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <section className="space-y-5 rounded-[14px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:bg-[#1e293b]">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-[#f1f5f9]">Export Controls</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Filter the dataset, preview the results, then export the CSV report.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <select
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
            defaultValue={type}
            name="type"
          >
            <option value="items">Items</option>
            <option value="claims">Claims</option>
            <option value="users">Users</option>
          </select>
          <input
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
            defaultValue={dateFrom}
            name="dateFrom"
            type="date"
          />
          <input
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
            defaultValue={dateTo}
            name="dateTo"
            type="date"
          />
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
          <table className="min-w-full divide-y divide-slate-200 dark:divide-[#334155]">
            <thead className="bg-white dark:bg-[#1e293b]">
              <tr className="bg-white text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:bg-[#1e293b] dark:text-slate-400">
                {columns.map((column) => (
                  <th key={column} className="px-5 py-4">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700 dark:divide-[#334155] dark:text-slate-200">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500 dark:text-slate-400" colSpan={columns.length || 1}>
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
      </section>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[14px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:bg-[#1e293b]">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-[#f1f5f9]">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}
