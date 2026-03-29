'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <h2 className="text-2xl font-semibold text-slate-900">Dashboard error</h2>
      <p className="mt-3 text-sm text-slate-500">{error.message || 'Unable to load this section.'}</p>
      <button
        className="mt-6 rounded-xl bg-brand-navy px-5 py-3 text-sm font-semibold text-white"
        onClick={reset}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}
