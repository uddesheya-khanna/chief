"use client";

import { Button } from "@/components/ui/button";

export function RouteErrorPanel({
  title,
  message,
  onRetry,
}: {
  title: string;
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-lg border border-destructive/25 bg-destructive/5 px-6 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {message ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
      ) : null}
      <Button type="button" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
