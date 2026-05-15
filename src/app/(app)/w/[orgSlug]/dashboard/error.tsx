"use client";

import { RouteErrorPanel } from "@/components/shared/route-error-panel";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorPanel
      title="Dashboard unavailable"
      message={error.message || "Something went wrong while loading the dashboard."}
      onRetry={reset}
    />
  );
}
