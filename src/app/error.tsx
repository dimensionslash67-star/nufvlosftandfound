'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-semibold text-slate-900">Something went wrong</h2>
        <p className="mt-3 text-sm text-slate-500">{error.message || 'Unexpected application error.'}</p>
        <button
          className="mt-6 rounded-xl bg-brand-navy px-5 py-3 text-sm font-semibold text-white"
          onClick={reset}
          type="button"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
