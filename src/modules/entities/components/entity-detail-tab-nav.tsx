"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";

import { cn } from "@/lib/utils";
import { entityDetailHref } from "@/modules/entities/entity-url";
import {
  entitySettingsHref,
  entitySignalsHref,
} from "@/modules/events/event-url";

type EntitySectionTab = "Timeline" | "Signals" | "Settings";

const tabs = (orgSlug: string, entityId: string) =>
  [
    { label: "Timeline" as const, href: entityDetailHref(orgSlug, entityId) },
    { label: "Signals" as const, href: entitySignalsHref(orgSlug, entityId) },
    { label: "Settings" as const, href: entitySettingsHref(orgSlug, entityId) },
  ] as const;

function activeTabFromSegments(segments: readonly string[]): EntitySectionTab {
  const root = segments[0];
  if (root === "settings") {
    return "Settings";
  }
  if (root === "signals") {
    return "Signals";
  }
  return "Timeline";
}

export function EntityDetailTabNav({
  orgSlug,
  entityId,
}: {
  orgSlug: string;
  entityId: string;
}) {
  const segments = useSelectedLayoutSegments();
  const activeLabel = activeTabFromSegments(segments);
  const items = tabs(orgSlug, entityId);

  return (
    <nav
      aria-label="Entity sections"
      className="flex flex-wrap gap-1 border-b border-border/70 pb-px"
    >
      {items.map((tab) => {
        const active = tab.label === activeLabel;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-muted/80 text-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
