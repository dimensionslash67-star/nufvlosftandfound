import { Card } from '@/components/ui/Card';
import type { Item } from '@/types/item';
import { ItemsFilterBar } from './ItemsFilterBar';
import { ItemsTable } from './ItemsTable';
import { PaginationControls } from './PaginationControls';

export function PublicBrowseSection({
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
  const rangeStart =
    pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(pagination.totalItems, pagination.page * pagination.pageSize);

  return (
    <section className="space-y-5" id="browse-items">
      <Card
        header={
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">NUFV Lost &amp; Found</h2>
            <p className="mt-2 text-sm text-slate-500">
              Showing available items for claiming. If you recognize something, click &quot;View Details&quot; to claim it.
            </p>
          </div>
        }
      >
        <ItemsFilterBar
          action="/"
          category={filters.category}
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          hiddenStatus="PENDING"
          search={filters.search}
        />
      </Card>

      <div className="rounded-2xl bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <p className="text-lg font-semibold text-slate-900">
          Showing {rangeStart}-{rangeEnd} of {pagination.totalItems} items
        </p>
      </div>

      <ItemsTable items={items} viewBasePath="/item" />

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
    </section>
  );
}
