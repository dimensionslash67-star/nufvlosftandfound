'use client';

function SurveyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

export function SurveySideButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Answer Survey"
      className="fixed bottom-24 right-4 z-40 flex h-12 items-center justify-center gap-2 rounded-full border border-slate-700 bg-[#0f172a] px-4 text-sm font-semibold text-white shadow-lg transition hover:border-indigo-500 hover:bg-[#1e293b] hover:text-white hover:shadow-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 sm:bottom-auto sm:right-0 sm:top-1/2 sm:h-auto sm:-translate-y-1/2 sm:rounded-l-xl sm:rounded-r-none sm:px-4 sm:py-3"
      onClick={onClick}
      type="button"
    >
      <SurveyIcon />
      <span className="hidden whitespace-nowrap sm:inline">Answer Survey</span>
    </button>
  );
}
