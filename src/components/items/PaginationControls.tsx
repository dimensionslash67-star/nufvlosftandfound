import Link from 'next/link';

export function PaginationControls({
  pathname,
  page,
  totalPages,
  query = {},
}: {
  pathname: string;
  page: number;
  totalPages: number;
  query?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {pages.map((pageNumber) => {
        const searchParams = new URLSearchParams();

        Object.entries(query).forEach(([key, value]) => {
          if (value) {
            searchParams.set(key, value);
          }
        });

        searchParams.set('page', String(pageNumber));

        return (
          <Link
            key={pageNumber}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
              pageNumber === page
                ? 'border-brand-navy bg-brand-navy text-white dark:border-indigo-400 dark:bg-indigo-500'
                : 'border-slate-300 bg-white text-slate-700 hover:border-brand-navy hover:text-brand-navy dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-200 dark:hover:border-indigo-300 dark:hover:text-indigo-200'
            }`}
            href={`${pathname}?${searchParams.toString()}`}
          >
            {pageNumber}
          </Link>
        );
      })}
    </div>
  );
}
