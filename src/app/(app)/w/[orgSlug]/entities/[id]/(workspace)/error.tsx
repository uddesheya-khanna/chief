"use client";

import { RouteErrorPanel } from "@/components/shared/route-error-panel";

export default function EntityWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorPanel
      title="Entity workspace unavailable"
      message={error.message || "Something went wrong while loading this entity."}
      onRetry={reset}
    />
  );
}
