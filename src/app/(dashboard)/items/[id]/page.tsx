import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DeleteItemButton } from '@/components/items/DeleteItemButton';
import { ItemCard } from '@/components/items/ItemCard';
import { ItemStatusBadge } from '@/components/items/ItemStatusBadge';
import { getAuthCookieName, verifyJWT } from '@/lib/auth';
import { getItemById } from '@/lib/items';
import { formatDisplayDate, formatItemCode, getUserDisplayName } from '@/lib/utils';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(getAuthCookieName())?.value;
  const session = token ? await verifyJWT(token) : null;
  const canManage = session?.role === 'ADMIN' || session?.userId === item.reporterId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-navy/70">
            {formatItemCode(item.id)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{item.itemName}</h1>
          <div className="mt-3">
            <ItemStatusBadge status={item.status} />
          </div>
        </div>

        {canManage ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex items-center rounded-full bg-brand-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-violet"
              href={`/items/${item.id}/edit`}
            >
              Edit Item
            </Link>
            <DeleteItemButton itemId={item.id} />
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ItemCard actionLabel="Back to Items" href="/items" item={item} />

        <div className="space-y-5">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <h2 className="text-xl font-semibold text-slate-900">Item Information</h2>
            <dl className="mt-5 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Category</dt>
                <dd className="mt-1 text-slate-900">{item.category}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date Found</dt>
                <dd className="mt-1 text-slate-900">{formatDisplayDate(item.dateReported)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Location Found</dt>
                <dd className="mt-1 text-slate-900">{item.location}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contact Info</dt>
                <dd className="mt-1 text-slate-900">{item.contactInfo || 'Not provided'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-900">
                  {item.description || 'No description provided.'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <h2 className="text-xl font-semibold text-slate-900">Reporting Details</h2>
            <dl className="mt-5 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reporter</dt>
                <dd className="mt-1 text-slate-900">{getUserDisplayName(item.reporter ?? undefined)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Created At</dt>
                <dd className="mt-1 text-slate-900">{formatDisplayDate(item.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Updated At</dt>
                <dd className="mt-1 text-slate-900">{formatDisplayDate(item.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Claimer</dt>
                <dd className="mt-1 text-slate-900">
                  {item.claimer ? getUserDisplayName(item.claimer) : 'Unclaimed'}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
