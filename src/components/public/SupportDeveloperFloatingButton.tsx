'use client';

import { useEffect, useState } from 'react';
import { CoffeeCupIcon, SupportDeveloperModal } from './SupportDeveloperModal';

export function FloatingSupportButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLabel(true), 3000);
    const hideTimer = window.setTimeout(() => setShowLabel(false), 7000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <div
          className={`rounded-full bg-gray-900 px-3 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-lg transition-all duration-500 ease-out ${
            showLabel
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none translate-x-4 opacity-0'
          }`}
        >
          <span className="flex items-center gap-2">
            <CoffeeCupIcon className="h-4 w-4 text-amber-300" />
            <span>Support the dev</span>
          </span>
        </div>

        <button
          aria-label="Support the Developer"
          className="animate-bounce-slow relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:from-yellow-300 hover:to-orange-400 hover:shadow-xl hover:shadow-orange-400/50 active:scale-95"
          onClick={() => setModalOpen(true)}
          onMouseEnter={() => setShowLabel(true)}
          onMouseLeave={() => setShowLabel(false)}
          type="button"
        >
          <span className="relative z-10">
            <CoffeeCupIcon className="h-7 w-7" />
          </span>
          <span className="animate-ping-slow absolute inset-0 rounded-full bg-yellow-400 opacity-30" />
          <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 opacity-20 blur-sm" />
        </button>
      </div>

      <SupportDeveloperModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

export const SupportDeveloperFloatingButton = FloatingSupportButton;
