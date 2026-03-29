'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ITEM_CATEGORIES, ITEM_STATUSES } from '@/lib/constants';
import { useDebounce } from '@/hooks/useDebounce';
import type { Item } from '@/types/item';
import { Input } from '@/components/ui/Input';
import { ItemsTable } from './ItemsTable';
import { PaginationControls } from './PaginationControls';

type SearchState = {
  search: string;
  category: string;
  status: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  page: string;
};

type SearchResponse = {
  items: Item[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

function getInitialState(searchParams: URLSearchParams): SearchState {
  return {
    search: searchParams.get('search') ?? '',
    category: searchParams.get('category') ?? '',
    status: searchParams.get('status') ?? '',
    location: searchParams.get('location') ?? '',
    dateFrom: searchParams.get('dateFrom') ?? '',
    dateTo: searchParams.get('dateTo') ?? '',
    page: searchParams.get('page') ?? '1',
  };
}

export function SearchDashboard() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [filters, setFilters] = useState<SearchState>(() => getInitialState(searchParams));
  const debouncedFilters = useDebounce(filters, 300);
  const [result, setResult] = useState<SearchResponse>({
    items: [],
    pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFilters(getInitialState(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(debouncedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);

    let active = true;
    setLoading(true);

    fetch(`/api/items${queryString ? `?${queryString}` : ''}`)
      .then((response) => response.json())
      .then((data: SearchResponse) => {
        if (!active) {
          return;
        }

        setResult(data);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setResult({
          items: [],
          pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
        });
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedFilters, pathname, router]);

  const rangeStart =
    result.pagination.totalItems === 0
      ? 0
      : (result.pagination.page - 1) * result.pagination.pageSize + 1;
  const rangeEnd = Math.min(
    result.pagination.totalItems,
    result.pagination.page * result.pagination.pageSize,
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Search Items</h2>
            <p className="text-sm text-slate-500">
              Search across item name, description, category, status, location, and dates.
            </p>
          </div>

          <Input
            className="text-base"
            label="Search"
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value, page: '1' }))
            }
            placeholder="Search for phone, wallet, bag, or item code"
            type="text"
            value={filters.search}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Category</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, category: event.target.value, page: '1' }))
                }
                value={filters.category}
              >
                <option value="">All categories</option>
                {ITEM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value, page: '1' }))
                }
                value={filters.status}
              >
                <option value="">All statuses</option>
                {ITEM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Location"
              onChange={(event) =>
                setFilters((current) => ({ ...current, location: event.target.value, page: '1' }))
              }
              placeholder="Hallway, library, gate"
              type="text"
              value={filters.location}
            />

            <Input
              label="Date From"
              onChange={(event) =>
                setFilters((current) => ({ ...current, dateFrom: event.target.value, page: '1' }))
              }
              type="date"
              value={filters.dateFrom}
            />

            <Input
              label="Date To"
              onChange={(event) =>
                setFilters((current) => ({ ...current, dateTo: event.target.value, page: '1' }))
              }
              type="date"
              value={filters.dateTo}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <p className="text-lg font-semibold text-slate-900">
          Showing {rangeStart}-{rangeEnd} of {result.pagination.totalItems} results
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      ) : result.items.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-lg font-semibold text-slate-900">No results found</p>
          <p className="mt-2 text-sm text-slate-500">
            Try widening the date range, clearing filters, or using a different keyword.
          </p>
        </div>
      ) : (
        <ItemsTable items={result.items} />
      )}

      <PaginationControls
        page={result.pagination.page}
        pathname="/search"
        query={{
          search: filters.search || undefined,
          category: filters.category || undefined,
          status: filters.status || undefined,
          location: filters.location || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        }}
        totalPages={result.pagination.totalPages}
      />
    </div>
  );
}
