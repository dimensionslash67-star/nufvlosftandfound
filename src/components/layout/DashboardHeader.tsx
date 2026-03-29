'use client';

import { FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getDashboardTitle } from '@/components/layout/dashboard-config';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { getUserDisplayName } from '@/lib/utils';

export function DashboardHeader({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const { user } = useAuth();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const debouncedSearch = useDebounce(search, 300);
  const title = getDashboardTitle(pathname);
  const displayName =
    getUserDisplayName(user ?? undefined) ||
    (user?.role === 'ADMIN' ? 'System Administrator' : 'Staff User');
  const initials = `${user?.firstName?.[0] ?? user?.username?.[0] ?? 'S'}${user?.lastName?.[0] ?? user?.username?.[1] ?? 'A'}`
    .toUpperCase();

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
  }, [searchParamsString]);

  useEffect(() => {
    if (pathname !== '/items') {
      return;
    }

    const currentSearch = searchParams.get('search') ?? '';
    const params = new URLSearchParams(searchParamsString);
    const nextSearch = debouncedSearch.trim();

    if (currentSearch === nextSearch) {
      return;
    }

    if (nextSearch) {
      params.set('search', nextSearch);
    } else {
      params.delete('search');
    }

    params.delete('page');

    const nextQuery = params.toString();
    const currentQuery = searchParamsString;

    if (nextQuery === currentQuery) {
      return;
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [debouncedSearch, pathname, router, searchParamsString]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = search.trim();
    router.push(term ? `/items?search=${encodeURIComponent(term)}` : '/items');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:px-8 dark:border-[#334155] dark:bg-[#0f172a]">
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle sidebar"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#f1f5f9]"
          onClick={onMenuToggle}
          type="button"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-[#f1f5f9]">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <form className="hidden md:block" onSubmit={onSubmit}>
          <div className="flex w-[320px] items-center gap-2 rounded-[10px] border border-slate-200 bg-slate-100 px-3 py-2.5 dark:border-[#334155] dark:bg-[#1e293b]">
            <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              className="w-full bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400 dark:text-[#f1f5f9] dark:placeholder:text-slate-500"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search items by code, description, category..."
              type="search"
              value={search}
            />
          </div>
        </form>

        <button
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-[#334155] dark:text-slate-400 dark:hover:bg-[#1e293b] dark:hover:text-[#f1f5f9]"
          type="button"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
            <path d="M10 17a2 2 0 0 0 4 0" />
          </svg>
          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6366f1] text-sm font-bold text-white">
            {initials}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-semibold text-slate-900 dark:text-[#f1f5f9]">{displayName}</p>
            <span className="mt-1 inline-flex rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-300">
              {user?.role ?? 'ADMIN'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
