"use client";

import { RouteErrorPanel } from "@/components/shared/route-error-panel";

export default function EntitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorPanel
      title="Entities unavailable"
      message={error.message || "Something went wrong while loading entities."}
      onRetry={reset}
    />
  );
}
