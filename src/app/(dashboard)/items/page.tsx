import Link from 'next/link';
import { ItemsFilterBar } from '@/components/items/ItemsFilterBar';
import { ItemsTable } from '@/components/items/ItemsTable';
import { PaginationControls } from '@/components/items/PaginationControls';
import { getItemsPage } from '@/lib/items';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const { items, filters, pagination } = await getItemsPage(resolvedSearchParams);
  const rangeStart = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(pagination.totalItems, pagination.page * pagination.pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Manage Items</h1>
          <p className="text-sm text-slate-500">Review, search, and update lost and found records.</p>
        </div>
        <Link
          className="inline-flex items-center rounded-full bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-navy shadow-[0_12px_30px_rgba(255,193,7,0.25)] transition hover:bg-[#f5a623]"
          href="/items/add"
        >
          Add Found Item
        </Link>
      </div>

      <ItemsFilterBar
        action="/items"
        category={filters.category}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        search={filters.search}
      />

      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Results</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            Showing {rangeStart}-{rangeEnd} of {pagination.totalItems} items
          </p>
        </div>
      </div>

      <ItemsTable items={items} />

      <PaginationControls
        page={pagination.page}
        pathname="/items"
        query={{
          category: filters.category,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          search: filters.search,
          status: filters.status,
        }}
        totalPages={pagination.totalPages}
      />
    </div>
  );
}
