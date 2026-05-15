"use client";

import { RouteErrorPanel } from "@/components/shared/route-error-panel";

export default function FeedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorPanel
      title="Feed unavailable"
      message={error.message || "Something went wrong while loading the intelligence feed."}
      onRetry={reset}
    />
  );
}
