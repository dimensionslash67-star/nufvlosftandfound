import Link from 'next/link';
import { ItemsFilterBar } from '@/components/items/ItemsFilterBar';
import { PaginationControls } from '@/components/items/PaginationControls';
import { getItemsPage } from '@/lib/items';
import { formatDisplayDate, formatItemCode, getStoredClaimerName } from '@/lib/utils';

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
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-[#f1f5f9]">Claimed Items</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Filtered view of items that have already been claimed.</p>
      </div>

      <ItemsFilterBar
        action="/items/claimed"
        category={filters.category}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        hiddenStatus="CLAIMED"
        search={filters.search}
      />

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-[#334155] dark:bg-[#1e293b]">
        <p className="text-lg font-semibold text-slate-900 dark:text-[#f1f5f9]">
          Showing {rangeStart}-{rangeEnd} of {pagination.totalItems} claimed items
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-[#334155] dark:bg-[#1e293b]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-[#334155]">
            <thead className="bg-brand-navy text-left text-sm uppercase tracking-wide text-white dark:bg-[#0a1628]">
              <tr>
                <th className="px-5 py-4 font-semibold">Item Code</th>
                <th className="px-5 py-4 font-semibold">Item Name</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Claimer</th>
                <th className="px-5 py-4 font-semibold">Claimed At</th>
                <th className="px-5 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700 dark:divide-[#334155] dark:text-slate-200">
              {items.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={6}>
                    No claimed items found.
                  </td>
                </tr>
              ) : null}

              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? 'bg-white dark:bg-[#1e293b]' : 'bg-slate-50/80 dark:bg-[#0f172a]'}
                >
                  <td className="px-5 py-4 font-mono font-semibold text-brand-navy dark:text-indigo-300">
                    {formatItemCode(item.itemCode)}
                  </td>
                  <td className="px-5 py-4">{item.itemName}</td>
                  <td className="px-5 py-4">{item.category}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900 dark:text-[#f1f5f9]">{getStoredClaimerName(item)}</div>
                  </td>
                  <td className="px-5 py-4">{formatDisplayDate(item.claimedAt, 'MMM d, yyyy h:mm a')}</td>
                  <td className="px-5 py-4">
                    <Link
                      className="inline-flex items-center rounded-full border border-brand-navy px-3 py-1.5 text-xs font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white dark:border-indigo-300 dark:text-indigo-200 dark:hover:bg-indigo-500 dark:hover:text-white"
                      href={`/items/${item.id}`}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
