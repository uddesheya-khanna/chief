import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RankedSearchHit } from "@/lib/embeddings/types";
import {
  EVENT_TYPE_LABEL,
  signalBand,
} from "@/modules/events/constants";
import { entitySignalDetailHref } from "@/modules/events/event-url";
import { SearchExplainPanel } from "@/modules/search/components/search-explain-panel";

function formatDetected(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function bandBorderClass(band: ReturnType<typeof signalBand>) {
  if (band === "high") {
    return "border-l-[3px] border-l-[var(--signal-high)]";
  }
  if (band === "medium") {
    return "border-l-[3px] border-l-[var(--signal-med)]";
  }
  return "border-l-[3px] border-l-[color-mix(in_oklab,var(--border)_85%,transparent)]";
}

export function SearchResultRow({
  orgSlug,
  hit,
  mode,
}: {
  orgSlug: string;
  hit: RankedSearchHit;
  mode: "hybrid" | "keyword" | "semantic";
}) {
  const band = signalBand(hit.signalScore);
  const href = entitySignalDetailHref(orgSlug, hit.entityId, hit.eventId);

  return (
    <article
      className={cn(
        "group border-b border-border/60 py-3.5 pl-3 pr-2 transition-colors hover:bg-muted/20 sm:pl-4",
        bandBorderClass(band),
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
        <span className="font-medium text-foreground/90">{hit.entityName}</span>
        <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-normal">
          {EVENT_TYPE_LABEL[hit.eventType as keyof typeof EVENT_TYPE_LABEL] ??
            hit.eventType}
        </Badge>
        {hit.matchKinds.map((kind) => (
          <Badge
            key={kind}
            variant="outline"
            className="h-5 px-1.5 text-[10px] font-normal uppercase tracking-wide"
          >
            {kind}
          </Badge>
        ))}
        <span className="font-mono tabular-nums">{hit.signalScore}</span>
        <span>{formatDetected(hit.detectedAt)}</span>
      </div>
      <h3 className="mt-1.5 text-[14px] font-medium leading-snug text-foreground">
        <Link href={href} className="hover:underline">
          {hit.title}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {hit.summary}
      </p>
      {hit.implication ? (
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground/90">
          {hit.implication}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <SearchExplainPanel hit={hit} mode={mode} />
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          relevance {Math.round(hit.finalScore * 100)}%
        </span>
      </div>
    </article>
  );
}
