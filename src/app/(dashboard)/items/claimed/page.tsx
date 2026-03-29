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
  const { items, filters, pagination } = await getItemsPage(resolvedSearchParams, { status: 'CLAIMED' });
  const rangeStart = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(pagination.totalItems, pagination.page * pagination.pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Claimed Items</h1>
        <p className="text-sm text-slate-500">Filtered view of items that have already been claimed.</p>
      </div>

      <ItemsFilterBar
        action="/items/claimed"
        category={filters.category}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        hiddenStatus="CLAIMED"
        search={filters.search}
      />

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <p className="text-lg font-semibold text-slate-900">
          Showing {rangeStart}-{rangeEnd} of {pagination.totalItems} claimed items
        </p>
      </div>

      <ItemsTable items={items} />

      <PaginationControls
        page={pagination.page}
        pathname="/items/claimed"
        query={{
          category: filters.category,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          search: filters.search,
          status: 'CLAIMED',
        }}
        totalPages={pagination.totalPages}
      />
    </div>
  );
}
