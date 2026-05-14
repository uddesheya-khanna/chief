export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 max-w-xl animate-pulse rounded-md bg-muted/80" />
      </div>
      <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
      <div className="space-y-0 overflow-hidden rounded-lg border border-border/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-border/50 px-4 py-4 last:border-b-0"
          >
            <div className="h-3 w-full max-w-[70%] animate-pulse rounded bg-muted" />
            <div className="mt-3 h-4 w-full max-w-[95%] animate-pulse rounded bg-muted/90" />
            <div className="mt-2 h-3 w-full max-w-[65%] animate-pulse rounded bg-muted/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
