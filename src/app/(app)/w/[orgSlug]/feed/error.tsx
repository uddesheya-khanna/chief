"use client";

export default function FeedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <p className="text-sm font-medium text-foreground">Feed unavailable</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {error.message || "Something went wrong while loading the feed."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Try again
      </button>
    </div>
  );
}
