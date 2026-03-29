export function Table({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-[#334155] dark:bg-[#1e293b]">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
