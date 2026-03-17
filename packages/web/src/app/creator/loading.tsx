export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 h-8 w-56 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="mt-8 h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
