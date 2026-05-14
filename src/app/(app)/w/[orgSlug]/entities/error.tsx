"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function EntitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-destructive/25 bg-destructive/5 p-6 text-center">
      <p className="text-sm font-medium text-foreground">
        Something went wrong loading entities.
      </p>
      <p className="text-xs text-muted-foreground">{error.message}</p>
      <Button type="button" size="sm" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
