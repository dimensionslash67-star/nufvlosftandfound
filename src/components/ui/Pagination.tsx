import Link from 'next/link';

export function Pagination({
  pathname,
  page,
  totalPages,
  totalItems,
  pageSize,
  query = {},
}: {
  pathname: string;
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  query?: Record<string, string | undefined>;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const rangeStart =
    totalItems && pageSize && totalItems > 0 ? (page - 1) * pageSize + 1 : undefined;
  const rangeEnd =
    totalItems && pageSize && totalItems > 0 ? Math.min(totalItems, page * pageSize) : undefined;

  const buildHref = (pageNumber: number) => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    params.set('page', String(pageNumber));
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) {
    return totalItems !== undefined && pageSize !== undefined ? (
      <p className="text-center text-sm text-slate-500">
        Showing {rangeStart ?? 0}-{rangeEnd ?? 0} of {totalItems} records
      </p>
    ) : null;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {totalItems !== undefined && pageSize !== undefined ? (
        <p className="text-sm text-slate-500">
          Showing {rangeStart ?? 0}-{rangeEnd ?? 0} of {totalItems} records
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          className={`inline-flex min-w-20 items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            page <= 1
              ? 'pointer-events-none border-slate-200 bg-slate-100 text-slate-400'
              : 'border-slate-300 bg-white text-slate-700 hover:border-brand-navy hover:text-brand-navy'
          }`}
          href={buildHref(Math.max(1, page - 1))}
        >
          Previous
        </Link>

        {pages.map((pageNumber) => (
          <Link
            key={pageNumber}
            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${
              pageNumber === page
                ? 'border-brand-navy bg-brand-navy text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-brand-navy hover:text-brand-navy'
            }`}
            href={buildHref(pageNumber)}
          >
            {pageNumber}
          </Link>
        ))}

        <Link
          className={`inline-flex min-w-20 items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            page >= totalPages
              ? 'pointer-events-none border-slate-200 bg-slate-100 text-slate-400'
              : 'border-slate-300 bg-white text-slate-700 hover:border-brand-navy hover:text-brand-navy'
          }`}
          href={buildHref(Math.min(totalPages, page + 1))}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
