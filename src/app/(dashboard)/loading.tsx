export default function Loading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}
