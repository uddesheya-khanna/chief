"use client";

export default function SearchError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <p className="text-sm text-muted-foreground">
        Failed to load search results
      </p>
      <button
        type="button"
        onClick={reset}
        className="text-sm underline text-foreground"
      >
        Try again
      </button>
    </div>
  );
}
