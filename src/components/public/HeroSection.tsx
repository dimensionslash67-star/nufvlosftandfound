import Link from 'next/link';

export function HeroSection() {
  return (
    <>
      <section
        className="relative min-h-[340px] overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,58,138,0.82), rgba(30,58,138,0.82)), url('/images/login-bg.jpg')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[clamp(2.5rem,7vw,5.5rem)] font-black uppercase tracking-[0.2em] text-white/10">
          Guided by Discipline, Grounded in Respect.
        </div>

        <div className="relative z-10 mx-auto flex min-h-[340px] max-w-7xl items-center justify-center px-4 py-16 md:px-8">
          <div className="max-w-3xl text-center text-white">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Lost Something?</h1>
            <p className="mt-4 text-base leading-7 text-slate-100">
              Search the official NU Fairview lost and found record, view item details, and follow the claim process with confidence.
            </p>
            <div className="mt-8">
              <Link
                className="inline-flex items-center rounded-full bg-[#10b981] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#059669]"
                href="#browse-items"
              >
                Browse Items Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fbbf24] py-3 text-center text-sm font-medium text-[#1f2937]">
        Helping students reconnect with what matters, one verified claim at a time.
      </section>
    </>
  );
}
