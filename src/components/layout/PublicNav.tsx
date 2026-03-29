import Link from 'next/link';

export function PublicNav() {
  return (
    <header className="bg-brand-navy text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link className="flex items-center gap-4" href="/">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold text-lg font-black text-brand-navy">
            NU
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/65">Fairview Lost &amp; Found</p>
            <p className="text-lg font-semibold">NU Fairview</p>
          </div>
        </Link>

        <nav className="flex items-center gap-3 text-sm md:gap-6">
          <Link className="hidden text-white/80 hover:text-white md:inline-flex" href="#browse-items">
            Find Your Lost Items Here
          </Link>
          <Link className="hidden text-white/80 hover:text-white md:inline-flex" href="#faq">
            FAQ
          </Link>
          <Link
            className="inline-flex items-center rounded-full bg-brand-gold px-5 py-2.5 font-semibold text-brand-navy transition hover:bg-[#f5a623]"
            href="/login"
          >
            Staff Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
