export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
