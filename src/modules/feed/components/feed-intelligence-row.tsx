import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ENTITY_TYPE_LABEL,
  isEntityType,
} from "@/modules/entities/constants";
import {
  formatConfidence,
  parseEventAiMetadata,
} from "@/modules/events/ai-metadata";
import {
  EVENT_TYPE_LABEL,
  SOURCE_TYPE_LABEL,
  signalBand,
} from "@/modules/events/constants";
import { entitySignalDetailHref } from "@/modules/events/event-url";
import type { FeedEventWithEntity } from "@/modules/events/loaders";
import { FeedDismissControl } from "@/modules/feed/components/feed-dismiss-control";

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

export function FeedIntelligenceRow({
  orgSlug,
  event,
}: {
  orgSlug: string;
  event: FeedEventWithEntity;
}) {
  const band = signalBand(event.signal_score);
  const aiMeta = parseEventAiMetadata(event.metadata);
  const entityName =
    event.tracked_entities?.name?.trim() || "Unknown entity";
  const entityType = event.tracked_entities?.type;
  const detailHref = entitySignalDetailHref(
    orgSlug,
    event.entity_id,
    event.id,
  );

  return (
    <article
      className={cn(
        "group relative border-b border-border/60 bg-card/40 py-3 pl-3 pr-2 transition-colors last:border-b-0 hover:bg-muted/20 sm:py-3.5 sm:pl-4",
        bandBorderClass(band),
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
        <span className="font-medium text-foreground/90">{entityName}</span>
        {entityType && isEntityType(entityType) ? (
          <span className="text-muted-foreground">
            · {ENTITY_TYPE_LABEL[entityType]}
          </span>
        ) : null}
        <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-normal">
          {EVENT_TYPE_LABEL[
            event.event_type as keyof typeof EVENT_TYPE_LABEL
          ] ?? event.event_type}
        </Badge>
        <span className="font-mono tabular-nums text-[12px] text-foreground/80">
          {event.signal_score}
        </span>
        {aiMeta ? (
          <span className="text-[11px] text-muted-foreground">
            · {formatConfidence(aiMeta.classification.confidence)} conf.
          </span>
        ) : null}
        <time
          dateTime={event.detected_at}
          className="ml-auto font-mono text-[12px] tabular-nums"
        >
          {formatDetected(event.detected_at)}
        </time>
      </div>
      <h2 className="mt-1.5 text-[14px] font-medium leading-snug tracking-tight text-foreground">
        <Link
          href={detailHref}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {event.title}
        </Link>
      </h2>
      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {event.summary}
      </p>
      {event.implication?.trim() ? (
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground/95">
          <span className="text-muted-foreground/80">Implication · </span>
          {event.implication}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
          {event.source_url?.trim() ? (
            <a
              href={event.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 truncate text-primary underline-offset-4 hover:underline"
            >
              <span className="truncate">{event.source_url}</span>
              <ExternalLink className="size-3 shrink-0" aria-hidden />
            </a>
          ) : (
            <span>
              {SOURCE_TYPE_LABEL[
                event.source_type as keyof typeof SOURCE_TYPE_LABEL
              ] ?? event.source_type}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {event.source_url?.trim() ? (
            <a
              href={event.source_url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-md px-2 text-xs font-medium text-muted-foreground underline-offset-4 hover:bg-muted/60 hover:text-foreground hover:underline",
              )}
            >
              Open
            </a>
          ) : null}
          {!event.is_dismissed ? (
            <FeedDismissControl orgSlug={orgSlug} eventId={event.id} />
          ) : null}
        </div>
      </div>
    </article>
  );
}
