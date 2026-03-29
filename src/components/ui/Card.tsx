import { cn } from '@/lib/utils';

export function Card({
  className,
  header,
  footer,
  children,
}: {
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        'rounded-2xl bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]',
        className,
      )}
    >
      {header ? <div className="border-b border-slate-200 px-6 py-4">{header}</div> : null}
      <div className="px-6 py-5">{children}</div>
      {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
    </article>
  );
}
