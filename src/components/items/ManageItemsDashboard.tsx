'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Item } from '@/types/item';
import { ClaimItemModal } from '@/components/items/ClaimItemModal';
import { DisposeItemModal } from '@/components/items/DisposeItemModal';
import { ItemDetailModal } from '@/components/items/ItemDetailModal';
import { ItemStatusBadge } from '@/components/items/ItemStatusBadge';

type FilterState = {
  search: string;
  status: string;
  category: string;
  date: string;
  disposal: string;
  page: string;
};

type ItemResponse = {
  items: Item[];
  total: number;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

const CATEGORY_OPTIONS = [
  'Electronics',
  'Books',
  'School Supplies',
  'Clothing',
  'Accessories',
  'Bags',
  'Jewelry',
  'Personal Item',
  'Documents',
  'Other Materials',
  'Tumbler',
] as const;

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Available', value: 'PENDING' },
  { label: 'Claimed', value: 'CLAIMED' },
  { label: 'Disposed', value: 'DISPOSED' },
] as const;

const DATE_OPTIONS = [
  { label: 'All Dates', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last 90 Days', value: '90days' },
] as const;

function getInitialState(searchParams: URLSearchParams): FilterState {
  return {
    search: searchParams.get('search') ?? '',
    status: searchParams.get('status') ?? '',
    category: searchParams.get('category') ?? '',
    date: searchParams.get('date') ?? '',
    disposal: searchParams.get('disposal') ?? 'false',
    page: searchParams.get('page') ?? '1',
  };
}

function buildQuery(filters: FilterState, extra?: Record<string, string>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    const isDefaultPage = key === 'page' && value === '1';

    if (value && !isDefaultPage && !(key === 'disposal' && value === 'false')) {
      params.set(key, value);
    }
  });

  Object.entries(extra ?? {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return params;
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatStatus(status: Item['status']) {
  if (status === 'PENDING') {
    return 'Available';
  }

  if (status === 'CLAIMED') {
    return 'Claimed';
  }

  if (status === 'DISPOSED') {
    return 'Disposed';
  }

  return status;
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
      <path d="M9 9h1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function ManageItemsDashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filters, setFilters] = useState<FilterState>(() => getInitialState(searchParams));
  const debouncedFilters = useDebounce(filters, 300);
  const [result, setResult] = useState<ItemResponse>({
    items: [],
    total: 0,
    pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
  });
  const [disposalCount, setDisposalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [disposeModalOpen, setDisposeModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setFilters(getInitialState(searchParams));
  }, [searchParamsString]);

  useEffect(() => {
    const params = buildQuery(debouncedFilters);
    const queryString = params.toString();
    const currentQuery = searchParamsString;

    if (queryString !== currentQuery) {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
      return;
    }

    let active = true;
    setLoading(true);

    Promise.all([
      fetch(`/api/items${queryString ? `?${queryString}` : ''}`).then((response) => response.json()),
      fetch('/api/items?disposal=true&page=1&pageSize=1').then((response) => response.json()),
    ])
      .then(([itemsData, disposalData]: [ItemResponse, ItemResponse]) => {
        if (!active) {
          return;
        }

        setResult(itemsData);
        setDisposalCount(disposalData.pagination?.totalItems ?? disposalData.total ?? 0);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setResult({
          items: [],
          total: 0,
          pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
        });
        setDisposalCount(0);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedFilters, pathname, refreshTick, router, searchParamsString]);

  const rangeStart = useMemo(() => {
    if (result.pagination.totalItems === 0) {
      return 0;
    }

    return (result.pagination.page - 1) * result.pagination.pageSize + 1;
  }, [result.pagination]);

  const rangeEnd = Math.min(
    result.pagination.totalItems,
    result.pagination.page * result.pagination.pageSize,
  );

  const setFilter = (key: keyof FilterState, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : '1',
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      date: '',
      disposal: 'false',
      page: '1',
    });
  };

  const exportCurrentList = async () => {
    setBusyAction('export');

    try {
      const params = buildQuery(filters, { page: '1', pageSize: '5000' });
      const response = await fetch(`/api/items?${params.toString()}`);
      const data: ItemResponse = await response.json();

      const rows = data.items.map((item) => [
        item.itemCode ?? '—',
        item.description ?? item.itemName,
        item.category,
        item.location,
        formatDate(item.dateReported),
        formatStatus(item.status),
      ]);

      const csv = [
        ['ITEM CODE', 'DESCRIPTION', 'CATEGORY', 'LOCATION', 'DATE RECEIVED', 'STATUS']
          .map(escapeCsvValue)
          .join(','),
        ...rows.map((row) => row.map((value) => escapeCsvValue(value)).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'filtered-items.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export items error:', error);
      window.alert('Unable to export the filtered items.');
    } finally {
      setBusyAction(null);
    }
  };

  const importCsv = async (file: File | null) => {
    if (!file) {
      return;
    }

    setBusyAction('import');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json().catch(() => ({ message: 'Import failed.' }));

      if (!response.ok) {
        throw new Error(data.message ?? 'Import failed.');
      }

      window.alert(data.message ?? 'CSV imported successfully.');
      setFilters((current) => ({ ...current, page: '1' }));
      setRefreshTick((current) => current + 1);
    } catch (error) {
      console.error('Import items error:', error);
      window.alert(error instanceof Error ? error.message : 'Unable to import CSV.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setBusyAction(null);
    }
  };

  const deleteItem = async (item: Item) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${item.itemCode ?? item.itemName}?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyAction(`delete-${item.id}`);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({ message: 'Unable to delete item.' }));

      if (!response.ok) {
        throw new Error(data.message ?? 'Unable to delete item.');
      }

      setRefreshTick((current) => current + 1);
    } catch (error) {
      console.error('Delete item error:', error);
      window.alert(error instanceof Error ? error.message : 'Unable to delete item.');
    } finally {
      setBusyAction(null);
    }
  };

  const activeDisposalTab = filters.disposal === 'true';

  const openClaimModal = (item: Item) => {
    setSelectedItem(item);
    setClaimModalOpen(true);
  };

  const openDisposeModal = (item: Item) => {
    setSelectedItem(item);
    setDisposeModalOpen(true);
  };

  const openDetailModal = (item: Item) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 bg-white px-1 dark:border-[#334155] dark:bg-[#1e293b]">
        <div className="flex flex-wrap gap-2">
          <button
            className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-sm transition ${
              !activeDisposalTab
                ? 'border-b-indigo-500 font-semibold text-indigo-500'
                : 'border-b-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            onClick={() => setFilter('disposal', 'false')}
            type="button"
          >
            <FileIcon />
            All Items
          </button>
          <button
            className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-sm transition ${
              activeDisposalTab
                ? 'border-b-indigo-500 font-semibold text-indigo-500'
                : 'border-b-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            onClick={() => setFilter('disposal', 'true')}
            type="button"
          >
            <TrashIcon />
            Items for Disposal
            {disposalCount > 0 ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-300">
                {disposalCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <div className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-[#334155] dark:bg-[#1e293b]">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-[#334155] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
              Filter Items
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Search, filter, and manage the complete lost and found inventory.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-[#334155] dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
              onClick={() => {
                setFilters((current) => ({
                  ...current,
                  disposal: 'true',
                  page: '1',
                }));
              }}
              type="button"
            >
              <SearchIcon />
              Find Overdue Items
            </button>

            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
              href="/items/add"
            >
              <PlusIcon />
              Add New Item
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <select
            className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
            onChange={(event) => setFilter('status', event.target.value)}
            value={filters.status}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
            onChange={(event) => setFilter('category', event.target.value)}
            value={filters.category}
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f1f5f9] dark:[color-scheme:dark]"
            onChange={(event) => setFilter('date', event.target.value)}
            value={filters.date}
          >
            {DATE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 px-4 py-2.5 text-[13px] font-semibold text-indigo-600 transition hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
            onClick={resetFilters}
            type="button"
          >
            <RotateIcon />
            Reset Filters
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-[#334155] dark:bg-[#1e293b] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-[#f1f5f9]">
            Showing {rangeStart}-{rangeEnd} of {result.pagination.totalItems} items
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {activeDisposalTab
              ? 'Items already disposed or already past their retention period.'
              : 'All active item records matching the current search and filters.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            accept=".csv"
            className="hidden"
            onChange={(event) => importCsv(event.target.files?.[0] ?? null)}
            ref={fileInputRef}
            type="file"
          />

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busyAction === 'import'}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <UploadIcon />
            {busyAction === 'import' ? 'Importing...' : 'Import CSV'}
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busyAction === 'export'}
            onClick={exportCurrentList}
            type="button"
          >
            <DownloadIcon />
            {busyAction === 'export' ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-[#334155] dark:bg-[#1e293b]">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-[#0f172a]" />
            ))}
          </div>
        ) : result.items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-[#f1f5f9]">
              No items found
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Try a different search term or reset the filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-[#334155]">
              <thead className="bg-brand-navy text-white dark:bg-[#0a1628]">
                <tr className="bg-brand-navy text-left text-xs font-semibold uppercase tracking-[0.08em] text-white dark:bg-[#0a1628]">
                  <th className="w-[140px] px-4 py-3">
                    Item Code
                  </th>
                  <th className="px-4 py-3">
                    Description
                  </th>
                  <th className="w-[130px] px-4 py-3">
                    Category
                  </th>
                  <th className="w-[160px] px-4 py-3">
                    Location
                  </th>
                  <th className="w-[120px] px-4 py-3">
                    Date Received
                  </th>
                  <th className="w-[100px] px-4 py-3">
                    Status
                  </th>
                  <th className="w-[220px] px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#334155]">
                {result.items.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-white text-[13px] text-slate-700 transition hover:bg-slate-50 dark:bg-[#1e293b] dark:text-slate-300 dark:hover:bg-[#0f172a]"
                  >
                    <td className="px-4 py-3.5">
                      <button
                        className="rounded border border-blue-200 bg-blue-100 px-2 py-1 font-mono text-xs font-semibold text-blue-800 transition hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                        onClick={() => {
                          if (item.itemCode) {
                            void navigator.clipboard.writeText(item.itemCode);
                          }
                        }}
                        type="button"
                      >
                        {item.itemCode ?? 'ITEM-XXXX-0000'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.description ?? item.itemName}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">{item.category}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">{item.location}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">{formatDate(item.dateReported)}</td>
                    <td className="px-4 py-3.5">
                      <ItemStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-md bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#24456f]"
                          onClick={() => openDetailModal(item)}
                          type="button"
                        >
                          View
                        </button>
                        {item.status === 'PENDING' ? (
                          <>
                            <button
                              className="rounded-md bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#24456f]"
                              onClick={() => openClaimModal(item)}
                              type="button"
                            >
                              Claim
                            </button>
                            <button
                              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
                              onClick={() => openDisposeModal(item)}
                              type="button"
                            >
                              Dispose
                            </button>
                          </>
                        ) : null}
                        <button
                          className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={busyAction === `delete-${item.id}`}
                          onClick={() => deleteItem(item)}
                          type="button"
                        >
                          {busyAction === `delete-${item.id}` ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Page {result.pagination.page} of {result.pagination.totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#334155] dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
            disabled={result.pagination.page <= 1}
            onClick={() => setFilter('page', String(result.pagination.page - 1))}
            type="button"
          >
            Previous
          </button>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#334155] dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
            disabled={result.pagination.page >= result.pagination.totalPages}
            onClick={() => setFilter('page', String(result.pagination.page + 1))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>

      <ClaimItemModal
        item={selectedItem}
        onOpenChange={setClaimModalOpen}
        onSuccess={() => setRefreshTick((current) => current + 1)}
        open={claimModalOpen}
      />

      <DisposeItemModal
        item={selectedItem}
        onOpenChange={setDisposeModalOpen}
        onSuccess={() => setRefreshTick((current) => current + 1)}
        open={disposeModalOpen}
      />

      <ItemDetailModal
        item={selectedItem}
        onOpenChange={setDetailModalOpen}
        open={detailModalOpen}
      />
    </div>
  );
}
