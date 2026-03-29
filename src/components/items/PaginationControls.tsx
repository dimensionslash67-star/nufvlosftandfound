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
                ? 'border-brand-navy bg-brand-navy text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-brand-navy hover:text-brand-navy'
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

