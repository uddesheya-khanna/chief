"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { entityDetailHref } from "@/modules/entities/entity-url";
import {
  entitySettingsHref,
  entitySignalsHref,
} from "@/modules/events/event-url";

const tabs = (orgSlug: string, entityId: string) =>
  [
    { label: "Timeline", href: entityDetailHref(orgSlug, entityId) },
    { label: "Signals", href: entitySignalsHref(orgSlug, entityId) },
    { label: "Settings", href: entitySettingsHref(orgSlug, entityId) },
  ] as const;

function normalizePath(p: string) {
  if (p.length > 1 && p.endsWith("/")) {
    return p.slice(0, -1);
  }
  return p;
}

export function EntityDetailTabNav({
  orgSlug,
  entityId,
}: {
  orgSlug: string;
  entityId: string;
}) {
  const pathname = normalizePath(usePathname());
  const items = tabs(orgSlug, entityId);

  return (
    <nav
      aria-label="Entity sections"
      className="flex flex-wrap gap-1 border-b border-border/70 pb-px"
    >
      {items.map((tab) => {
        const tabPath = normalizePath(tab.href);
        const isTimeline = tab.label === "Timeline";
        const entityBase = normalizePath(entityDetailHref(orgSlug, entityId));
        const active = isTimeline
          ? pathname === entityBase
          : pathname === tabPath || pathname.startsWith(`${tabPath}/`);

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
