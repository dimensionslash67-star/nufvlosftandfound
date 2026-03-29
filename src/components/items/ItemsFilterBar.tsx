import Link from 'next/link';
import { ITEM_CATEGORIES } from '@/lib/constants';

export function ItemsFilterBar({
  action,
  search,
  category,
  dateFrom,
  dateTo,
  hiddenStatus,
}: {
  action: string;
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  hiddenStatus?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-[#334155] dark:bg-[#1e293b] md:p-6">
      <form action={action} className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_auto]">
        {hiddenStatus ? <input name="status" type="hidden" value={hiddenStatus} /> : null}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Search
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:placeholder:text-slate-500 dark:[color-scheme:dark]"
            defaultValue={search}
            name="search"
            placeholder="Search item code, name, description, or location"
            type="search"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Category
          </label>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
            defaultValue={category ?? ''}
            name="category"
          >
            <option value="">All categories</option>
            {ITEM_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Date From
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
            defaultValue={dateFrom}
            name="dateFrom"
            type="date"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Date To
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
            defaultValue={dateTo}
            name="dateTo"
            type="date"
          />
        </div>

        <div className="flex items-end gap-3">
          <button
            className="inline-flex h-[50px] items-center justify-center rounded-full bg-brand-navy px-5 text-sm font-semibold text-white transition hover:bg-brand-navy/90 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            type="submit"
          >
            Apply Filters
          </button>
          <Link
            className="inline-flex h-[50px] items-center justify-center rounded-full border border-red-300 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10"
            href={action}
          >
            Clear Filters
          </Link>
        </div>
      </form>
    </div>
  );
}
