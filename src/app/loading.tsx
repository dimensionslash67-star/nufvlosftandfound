export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-10 md:px-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}
