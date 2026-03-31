import Link from 'next/link';
import { formatDisplayDate } from '@/lib/utils';
import type { Item } from '@/types/item';
import { ItemStatusBadge } from './ItemStatusBadge';

export function ItemCard({
  item,
  href = `/items/${item.id}`,
  actionLabel = 'View Details',
}: {
  item: Item;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-[#334155] dark:bg-[#1e293b]">
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-navy/70 dark:text-indigo-300/80">
              {item.itemCode ?? 'ITEM-XXXX-0000'}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-[#f1f5f9]">
              {item.itemName}
            </h3>
          </div>
          <ItemStatusBadge status={item.status} />
        </div>

        <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Category
            </p>
            <p className="mt-1 text-slate-800 dark:text-[#f1f5f9]">{item.category}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Date Found
            </p>
            <p className="mt-1 text-slate-800 dark:text-[#f1f5f9]">
              {formatDisplayDate(item.dateReported)}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Location Found
            </p>
            <p className="mt-1 text-slate-800 dark:text-[#f1f5f9]">{item.location}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Description
            </p>
            <p className="mt-1 line-clamp-2 text-slate-700 dark:text-slate-300">
              {item.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <Link
          className="inline-flex items-center rounded-full border border-brand-navy px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white dark:border-indigo-300 dark:text-indigo-200 dark:hover:bg-indigo-500"
          href={href}
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}
