import Link from 'next/link';
import { formatDisplayDate, formatItemCode } from '@/lib/utils';
import type { Item } from '@/types/item';
import { ItemStatusBadge } from './ItemStatusBadge';

export function ItemsTable({
  items,
  emptyMessage = 'No items found.',
  viewBasePath = '/items',
}: {
  items: Item[];
  emptyMessage?: string;
  viewBasePath?: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-brand-navy text-white">
            <tr className="bg-brand-navy text-left text-sm uppercase tracking-wide">
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
                  {emptyMessage}
                </td>
              </tr>
            ) : null}

            {items.map((item, index) => (
              <tr
                key={item.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}
              >
                <td className="px-5 py-4 font-semibold text-brand-navy">{formatItemCode(item.id)}</td>
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
                    className="inline-flex items-center rounded-full border border-brand-navy px-3 py-1.5 text-xs font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white"
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
