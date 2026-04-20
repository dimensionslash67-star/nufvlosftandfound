'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

const variantStyles = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  error:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
} as const;

export function Toast({
  message,
  variant,
  onClose,
  duration = 3000,
}: {
  message: string;
  variant: keyof typeof variantStyles;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeout);
  }, [duration, onClose]);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 max-w-sm">
      <div
        className={cn(
          'rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur',
          variantStyles[variant],
        )}
      >
        {message}
      </div>
    </div>
  );
}
