import { cn } from '@/lib/utils';

const variants = {
  default: 'border border-slate-300 bg-slate-100 text-slate-700',
  success: 'border border-green-300 bg-green-100 text-green-800',
  info: 'border border-blue-300 bg-blue-100 text-blue-800',
  warning: 'border border-amber-300 bg-amber-100 text-amber-800',
  danger: 'border border-pink-300 bg-pink-100 text-pink-800',
} as const;

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
