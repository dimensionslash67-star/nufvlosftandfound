import type { ItemStatus } from '@/types/item';

export function ItemStatusBadge({ status }: { status: ItemStatus | string }) {
  const normalizedStatus = status.toUpperCase();

  const styles: Record<string, string> = {
    PENDING:
      'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
    AVAILABLE:
      'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
    CLAIMED:
      'bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700',
    RETURNED:
      'bg-teal-100 text-teal-800 border border-teal-300 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-700',
    DISPOSED:
      'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-700',
  };

  const labels: Record<string, string> = {
    PENDING: 'Available',
    AVAILABLE: 'Available',
    CLAIMED: 'Claimed',
    RETURNED: 'Returned',
    DISPOSED: 'Disposed',
  };

  const style = styles[normalizedStatus] ?? styles.PENDING;
  const label = labels[normalizedStatus] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}
