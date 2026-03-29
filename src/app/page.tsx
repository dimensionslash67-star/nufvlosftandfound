import { BrowseSection } from '@/components/public/BrowseSection';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/public/HeroSection';
import { HowToClaim } from '@/components/public/HowToClaim';
import { getItemsPage } from '@/lib/items';

export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const { items, filters, pagination } = await getItemsPage(resolvedSearchParams, {
    status: 'PENDING',
    publicOnly: true,
  });

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Header />
      <HeroSection />

      <main className="mx-auto max-w-7xl space-y-14 px-4 py-10 md:px-8">
        <HowToClaim />
        <BrowseSection
          filters={{
            category: filters.category,
            search: filters.search,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
          }}
          items={items}
          pagination={pagination}
        />
      </main>

      <Footer />
    </div>
  );
}
