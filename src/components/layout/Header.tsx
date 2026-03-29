'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FAQModal } from '@/components/public/FAQModal';

export function Header() {
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    <>
      <header className="bg-[#1a2744] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link className="flex items-center gap-4" href="/">
            <div className="shrink-0 bg-transparent">
              <Image
                alt="NU Fairview Lost and Found logo"
                className="h-[60px] w-[60px] rounded-full"
                height={60}
                priority
                src="/images/logo-circle.png"
                style={{ mixBlendMode: 'screen', objectFit: 'contain' }}
                width={60}
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Fairview Lost &amp; Found</p>
              <p className="text-lg font-semibold">NU Fairview</p>
            </div>
          </Link>

          <nav className="flex items-center gap-3 md:gap-4">
            <Link className="hidden text-sm text-white/80 hover:text-white md:inline-flex" href="#browse-items">
              Find Your Lost Items Here
            </Link>
            <button
              className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              onClick={() => setFaqOpen(true)}
              type="button"
            >
              FAQ
            </button>
            <Link
              className="inline-flex items-center rounded-full bg-[#fbbf24] px-5 py-2.5 text-sm font-semibold text-[#1e3a8a] transition hover:bg-[#f59e0b]"
              href="/login"
            >
              Staff Login
            </Link>
          </nav>
        </div>
      </header>

      <FAQModal onOpenChange={setFaqOpen} open={faqOpen} />
    </>
  );
}
