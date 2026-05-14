"use client";

import { useOptimistic, useTransition } from "react";

import { setEntityActive } from "@/actions/entities";
import { Button } from "@/components/ui/button";

export function EntityActiveToggle({
  orgSlug,
  entityId,
  isActive,
}: {
  orgSlug: string;
  entityId: string;
  isActive: boolean;
}) {
  const [optimisticActive, setOptimistic] = useOptimistic(
    isActive,
    (_current, next: boolean) => next,
  );
  const [pending, startTransition] = useTransition();

  function apply(next: boolean) {
    startTransition(async () => {
      setOptimistic(next);
      const fd = new FormData();
      fd.set("orgSlug", orgSlug);
      fd.set("entityId", entityId);
      fd.set("isActive", String(next));
      await setEntityActive(fd);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={
          optimisticActive
            ? "text-[11px] font-medium uppercase tracking-wider text-emerald-800 dark:text-emerald-200"
            : "text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
        }
      >
        {optimisticActive ? "Active" : "Archived"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={pending}
        className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => apply(!optimisticActive)}
      >
        {optimisticActive ? "Archive" : "Restore"}
      </Button>
    </div>
  );
}
