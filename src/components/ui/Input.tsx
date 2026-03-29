import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  }
>(function Input({ label, error, className, id, ...props }, ref) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span> : null}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#f1f5f9] dark:placeholder:text-slate-500 dark:[color-scheme:dark]',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-slate-200 focus:border-brand-navy focus:ring-2 focus:ring-brand-gold/30 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20',
          className,
        )}
        id={inputId}
        {...props}
      />
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
});
