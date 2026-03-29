import Link from 'next/link';
import { formatDisplayDate, formatItemCode } from '@/lib/utils';
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
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-[16/9] bg-slate-100">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={item.itemName} className="h-full w-full object-cover" src={item.imageUrl} />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-navy to-brand-navy/70 text-center text-sm font-medium text-white">
            No image available
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-navy/70">
              {formatItemCode(item.id)}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.itemName}</h3>
          </div>
          <ItemStatusBadge status={item.status} />
        </div>

        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</p>
            <p className="mt-1 text-slate-800">{item.category}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date Found</p>
            <p className="mt-1 text-slate-800">{formatDisplayDate(item.dateReported)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location Found</p>
            <p className="mt-1 text-slate-800">{item.location}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
            <p className="mt-1 line-clamp-2 text-slate-700">
              {item.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <Link
          className="inline-flex items-center rounded-full border border-brand-navy px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white"
          href={href}
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}
