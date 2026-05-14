"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getWorkspaceFeedFreshEventCount } from "@/actions/events";
import { Button } from "@/components/ui/button";

export function FeedNewSignalsBanner({
  orgSlug,
  baselineDetectedAt,
}: {
  orgSlug: string;
  baselineDetectedAt: string | null;
}) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const baselineRef = useRef(baselineDetectedAt);

  useEffect(() => {
    baselineRef.current = baselineDetectedAt;
    setCount(0);
  }, [baselineDetectedAt]);

  const poll = useCallback(async () => {
    const baseline = baselineRef.current;
    if (!baseline) {
      return;
    }
    const n = await getWorkspaceFeedFreshEventCount(orgSlug, baseline);
    setCount(n);
  }, [orgSlug]);

  useEffect(() => {
    if (!baselineDetectedAt) {
      return;
    }
    const id = window.setInterval(() => {
      void poll();
    }, 90_000);
    return () => window.clearInterval(id);
  }, [baselineDetectedAt, poll]);

  if (!baselineDetectedAt || count <= 0) {
    return null;
  }

  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/30 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-foreground">
        {count === 1
          ? "1 new signal since this view loaded."
          : `${count} new signals since this view loaded.`}
      </p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => {
          setCount(0);
          router.refresh();
        }}
      >
        Refresh feed
      </Button>
    </div>
  );
}
