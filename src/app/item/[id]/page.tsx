import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicClaimForm } from '@/components/items/PublicClaimForm';
import { ItemCard } from '@/components/items/ItemCard';
import { ItemStatusBadge } from '@/components/items/ItemStatusBadge';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SurveyWidget } from '@/components/SurveyWidget';
import { projectPublicItem } from '@/lib/itemVisibility';
import { getItemById } from '@/lib/items';
import { formatDisplayDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item || item.status !== 'PENDING' || item.isFlagged) {
    notFound();
  }

  const publicItem = projectPublicItem(item);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Header />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-sm text-slate-500">
              {publicItem.itemCode ?? 'ITEM-XXXX-0000'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{publicItem.itemName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <ItemStatusBadge status={publicItem.status} />
            <Link
              className="inline-flex items-center rounded-full border border-brand-navy px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white"
              href="/"
            >
              Back to Public View
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <ItemCard
            actionLabel="Back to Public View"
            href="/"
            item={publicItem as unknown as import('@/types/item').Item}
          />

          <div className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <h2 className="text-xl font-semibold text-slate-900">Item Details</h2>
              <dl className="mt-5 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Category
                  </dt>
                  <dd className="mt-1 text-slate-900">{publicItem.category}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Date Found
                  </dt>
                  <dd className="mt-1 text-slate-900">{formatDisplayDate(publicItem.dateReported)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Location Found
                  </dt>
                  <dd className="mt-1 text-slate-900">{publicItem.location}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <h2 className="text-xl font-semibold text-slate-900">Submit a Claim</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Share identifying details first, then continue to the staff login page to complete
                the formal verification process.
              </p>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">
                  Visit the Lost &amp; Found Office for claim verification.
                </p>
              </div>
              <div className="mt-5">
                <PublicClaimForm itemId={publicItem.id} />
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <SurveyWidget />
    </div>
  );
}
