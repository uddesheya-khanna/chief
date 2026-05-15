"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ENTITY_TYPES,
  ENTITY_TYPE_LABEL,
  type EntityType,
} from "@/modules/entities/constants";
import { EVENT_TYPES, EVENT_TYPE_LABEL } from "@/modules/events/constants";
import { workspaceFeedHref } from "@/modules/feed/feed-href";
import type { WorkspaceFeedQuery } from "@/modules/feed/search-params";
import { serializeWorkspaceFeedQuery } from "@/modules/feed/search-params";

const SIGNAL_OPTIONS = [
  { id: "high", label: "High (80+)" },
  { id: "medium", label: "Medium (50–79)" },
  { id: "low", label: "Low (<50)" },
] as const;

function toggle<T extends string>(list: T[], value: T): T[] {
  if (list.includes(value)) {
    return list.filter((v) => v !== value);
  }
  return [...list, value];
}

export function WorkspaceFeedFilters({
  orgSlug,
  query,
}: {
  orgSlug: string;
  query: WorkspaceFeedQuery;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(query);

  const apply = useCallback(() => {
    const qs = serializeWorkspaceFeedQuery(draft);
    startTransition(() => {
      router.push(workspaceFeedHref(orgSlug, qs));
    });
  }, [draft, orgSlug, router]);

  const reset = useCallback(() => {
    startTransition(() => {
      router.push(workspaceFeedHref(orgSlug, ""));
    });
  }, [orgSlug, router]);

  return (
    <div
      className="space-y-4 rounded-lg border border-border/70 bg-card/50 p-4"
      aria-busy={pending}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Filters
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            disabled={pending}
            onClick={reset}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 text-xs"
            disabled={pending}
            onClick={apply}
          >
            {pending ? "Applying…" : "Apply"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground">
            Entity type
          </legend>
          <div className="flex flex-wrap gap-2">
            {ENTITY_TYPES.map((t) => (
              <label
                key={t}
                className="flex cursor-pointer items-center gap-1.5 text-[13px]"
              >
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-border"
                  checked={draft.entityTypes.includes(t)}
                  onChange={() =>
                    setDraft((d) => ({
                      ...d,
                      entityTypes: toggle(d.entityTypes, t as EntityType),
                      page: 1,
                    }))
                  }
                />
                {ENTITY_TYPE_LABEL[t]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground">
            Event type
          </legend>
          <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
            {EVENT_TYPES.map((t) => (
              <label
                key={t}
                className="flex cursor-pointer items-center gap-2 text-[13px]"
              >
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-border"
                  checked={draft.eventTypes.includes(t)}
                  onChange={() =>
                    setDraft((d) => ({
                      ...d,
                      eventTypes: toggle(d.eventTypes, t),
                      page: 1,
                    }))
                  }
                />
                {EVENT_TYPE_LABEL[t]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground">
            Signal level
          </legend>
          <div className="flex flex-col gap-2">
            {SIGNAL_OPTIONS.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-center gap-2 text-[13px]"
              >
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-border"
                  checked={draft.signalLevels.includes(o.id)}
                  onChange={() =>
                    setDraft((d) => ({
                      ...d,
                      signalLevels: toggle(
                        d.signalLevels,
                        o.id as "high" | "medium" | "low",
                      ),
                      page: 1,
                    }))
                  }
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="feed-from" className="text-xs text-muted-foreground">
              From
            </Label>
            <input
              id="feed-from"
              type="date"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
              value={draft.dateFrom ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  dateFrom: e.target.value || null,
                  page: 1,
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feed-to" className="text-xs text-muted-foreground">
              To
            </Label>
            <input
              id="feed-to"
              type="date"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
              value={draft.dateTo ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  dateTo: e.target.value || null,
                  page: 1,
                }))
              }
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              className="size-3.5 rounded border-border"
              checked={draft.includeDismissed}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  includeDismissed: e.target.checked,
                  page: 1,
                }))
              }
            />
            Show dismissed
          </label>
        </div>
      </div>
    </div>
  );
}
