import Link from 'next/link';

export function HeroBanner() {
  return (
    <section
      className="relative min-h-[360px] overflow-hidden bg-brand-navy"
      style={{
        backgroundImage:
          "linear-gradient(rgba(26,35,126,0.88), rgba(26,35,126,0.74)), url('/images/banner.png')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[clamp(2.8rem,9vw,7rem)] font-black uppercase tracking-[0.18em] text-white/10">
        Guided by Discipline, Grounded in Respect.
      </div>

      <div className="absolute inset-y-0 left-3 z-10 hidden items-center md:flex">
        <button
          aria-label="Previous slide"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-xl text-white"
          type="button"
        >
          &lt;
        </button>
      </div>
      <div className="absolute inset-y-0 right-3 z-10 hidden items-center md:flex">
        <button
          aria-label="Next slide"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-xl text-white"
          type="button"
        >
          &gt;
        </button>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[360px] max-w-7xl items-center justify-center px-4 py-16 md:px-8">
        <div className="max-w-2xl rounded-[2rem] border border-white/15 bg-white/10 p-8 text-center text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)] backdrop-blur md:p-10">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Lost Something?</h1>
          <p className="mt-4 text-base leading-7 text-slate-100">
            Browse available found items, filter by category and date, and connect with campus staff to start the verification process.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              className="inline-flex items-center rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
              href="#browse-items"
            >
              Browse Items Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
