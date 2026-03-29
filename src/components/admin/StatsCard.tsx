export function StatsCard({
  title,
  value,
  accentClass,
}: {
  title: string;
  value: string | number;
  accentClass: string;
}) {
  return (
    <article className="rounded-lg bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className={`h-1 w-12 rounded-full ${accentClass}`} />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}

