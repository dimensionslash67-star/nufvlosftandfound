'use client';

import Link from 'next/link';
import { formatDisplayDate } from '@/lib/utils';
import type { Item } from '@/types/item';
import { ItemStatusBadge } from './ItemStatusBadge';

const UNASSIGNED_ITEM_CODE = 'ITEM-XXXX-0000';

export function ItemsTable({
  items,
  emptyMessage = 'No items found.',
  viewBasePath = '/items',
  copyItemCode = false,
}: {
  items: Item[];
  emptyMessage?: string;
  viewBasePath?: string;
  copyItemCode?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-[#334155] dark:bg-[#1e293b]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-[#334155]">
          <thead className="bg-brand-navy text-white dark:bg-[#0a1628]">
            <tr className="bg-brand-navy text-left text-sm uppercase tracking-wide dark:bg-[#0a1628]">
              <th className="px-5 py-4 font-semibold">Item Code</th>
              <th className="px-5 py-4 font-semibold">Item Type</th>
              <th className="px-5 py-4 font-semibold">Description</th>
              <th className="px-5 py-4 font-semibold">Location Found</th>
              <th className="px-5 py-4 font-semibold">Date Found</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-700 dark:divide-[#334155] dark:text-slate-200">
            {items.length === 0 ? (
              <tr>
                <td className="px-5 py-10 text-center text-slate-500 dark:text-slate-400" colSpan={7}>
                  {emptyMessage}
                </td>
              </tr>
            ) : null}

            {items.map((item, index) => (
              <tr
                key={item.id}
                className={index % 2 === 0 ? 'bg-white dark:bg-[#1e293b]' : 'bg-slate-50/80 dark:bg-[#0f172a]'}
              >
                <td className="px-5 py-4 font-semibold text-brand-navy dark:text-indigo-300">
                  {copyItemCode ? (
                    <button
                      className="font-mono hover:text-brand-violet dark:hover:text-indigo-200"
                      onClick={async () => {
                        if (item.itemCode) {
                          await navigator.clipboard.writeText(item.itemCode);
                        }
                      }}
                      type="button"
                    >
                      {item.itemCode ?? UNASSIGNED_ITEM_CODE}
                    </button>
                  ) : (
                    <span className="font-mono">{item.itemCode ?? UNASSIGNED_ITEM_CODE}</span>
                  )}
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
                  <Link
                    className="inline-flex items-center rounded-full border border-brand-navy px-3 py-1.5 text-xs font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white dark:border-indigo-300 dark:text-indigo-200 dark:hover:bg-indigo-500 dark:hover:text-white"
                    href={`${viewBasePath}/${item.id}`}
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
  );
}
