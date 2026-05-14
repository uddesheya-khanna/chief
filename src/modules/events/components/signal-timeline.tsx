import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  EVENT_TYPE_LABEL,
  SOURCE_TYPE_LABEL,
  signalBand,
} from "@/modules/events/constants";
import { entitySignalDetailHref } from "@/modules/events/event-url";
import type { IntelligenceEventRow } from "@/modules/events/loaders";

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
  return "border-l-[3px] border-l-transparent";
}

export function SignalTimelineCard({
  orgSlug,
  entityId,
  event,
}: {
  orgSlug: string;
  entityId: string;
  event: IntelligenceEventRow;
}) {
  const band = signalBand(event.signal_score);
  const href = entitySignalDetailHref(orgSlug, entityId, event.id);

  return (
    <article
      className={cn(
        "group relative bg-card/30 py-4 pl-4 pr-3 transition-colors hover:bg-muted/25 sm:pl-5",
        bandBorderClass(band),
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
        <Badge variant="secondary" className="font-normal">
          {EVENT_TYPE_LABEL[
            event.event_type as keyof typeof EVENT_TYPE_LABEL
          ] ?? event.event_type}
        </Badge>
        <span className="font-mono tabular-nums text-[12px]">
          {event.signal_score}
        </span>
        <span className="ml-auto font-mono text-[12px] tabular-nums">
          {formatDetected(event.detected_at)}
        </span>
      </div>
      <h3 className="mt-2 font-medium leading-snug text-foreground">
        <Link
          href={href}
          className="after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {event.title}
        </Link>
      </h3>
      {event.implication?.trim() ? (
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {event.implication}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
        {event.source_url?.trim() ? (
          <a
            href={event.source_url}
            target="_blank"
            rel="noreferrer"
            className="relative z-10 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Source
            <ExternalLink className="size-3" />
          </a>
        ) : (
          <span>
            {SOURCE_TYPE_LABEL[
              event.source_type as keyof typeof SOURCE_TYPE_LABEL
            ] ?? event.source_type}
          </span>
        )}
      </div>
    </article>
  );
}

export function SignalTimeline({
  orgSlug,
  entityId,
  events,
}: {
  orgSlug: string;
  entityId: string;
  events: IntelligenceEventRow[];
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-14 text-center">
        <p className="text-[15px] font-medium text-foreground">
          No signals on the timeline yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Intelligence events appear here in reverse chronological order. Add a
          manual signal from the Signals tab to seed data while ingestion is
          offline.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="divide-y divide-border/60">
        {events.map((ev) => (
          <SignalTimelineCard
            key={ev.id}
            orgSlug={orgSlug}
            entityId={entityId}
            event={ev}
          />
        ))}
      </div>
    </div>
  );
}
