'use client';

import { useState } from 'react';
import { ItemStatusBadge } from '@/components/items/ItemStatusBadge';
import { PaginationControls } from '@/components/items/PaginationControls';
import { ItemsFilterBar } from '@/components/items/ItemsFilterBar';
import { formatDisplayDate } from '@/lib/utils';
import type { Item } from '@/types/item';
import { ItemDetailModal } from './ItemDetailModal';

export function BrowseSection({
  items,
  filters,
  pagination,
}: {
  items: Item[];
  filters: {
    category?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const rangeStart =
    pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(pagination.totalItems, pagination.page * pagination.pageSize);

  return (
    <section className="space-y-5" id="browse-items">
      <div className="rounded-3xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <h2 className="text-2xl font-semibold text-slate-900">NUFV Lost &amp; Found</h2>
        <p className="mt-2 text-sm text-slate-500">
          Showing available items for claiming. If you recognize something, click &quot;View Details&quot; to claim it.
        </p>

        <div className="mt-6">
          <ItemsFilterBar
            action="/"
            category={filters.category}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            hiddenStatus="PENDING"
            search={filters.search}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <p className="text-lg font-semibold text-slate-900">
          Showing {rangeStart}-{rangeEnd} of {pagination.totalItems} items
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-[#1e3a8a] text-left text-sm uppercase tracking-wide text-white">
                <th className="px-5 py-4 font-semibold">Item Code</th>
                <th className="px-5 py-4 font-semibold">Item Type</th>
                <th className="px-5 py-4 font-semibold">Description</th>
                <th className="px-5 py-4 font-semibold">Location Found</th>
                <th className="px-5 py-4 font-semibold">Date Found</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {items.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500" colSpan={7}>
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                    <td className="px-5 py-4 font-semibold text-[#1e3a8a]">
                      {item.itemCode ?? 'ITEM-XXXX-0000'}
                    </td>
                    <td className="px-5 py-4">{item.category}</td>
                    <td className="px-5 py-4">
                      <p className="max-w-xs truncate">{item.description || item.itemName}</p>
                    </td>
                    <td className="px-5 py-4">{item.location}</td>
                    <td className="px-5 py-4">{formatDisplayDate(item.dateReported)}</td>
                    <td className="px-5 py-4">
                      <ItemStatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        className="inline-flex items-center rounded-full border border-[#1e3a8a] px-3 py-1.5 text-xs font-semibold text-[#1e3a8a] transition hover:bg-[#1e3a8a] hover:text-white"
                        onClick={() => setSelectedItem(item)}
                        type="button"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls
        page={pagination.page}
        pathname="/"
        query={{
          category: filters.category,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          search: filters.search,
          status: 'PENDING',
        }}
        totalPages={pagination.totalPages}
      />

      <ItemDetailModal item={selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)} open={Boolean(selectedItem)} />
    </section>
  );
}
