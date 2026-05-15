import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Surface } from "@/components/primitives/surface";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EventDetailActions } from "@/modules/events/components/event-detail-actions";
import { EventIntelligenceMeta } from "@/modules/events/components/event-intelligence-meta";
import { EventSignalScoreForm } from "@/modules/events/components/event-signal-score-form";
import { parseEventAiMetadata } from "@/modules/events/ai-metadata";
import {
  EVENT_TYPE_LABEL,
  SOURCE_TYPE_LABEL,
  signalBand,
} from "@/modules/events/constants";
import { entitySignalsHref } from "@/modules/events/event-url";
import type { IntelligenceEventRow } from "@/modules/events/loaders";
import type { Json } from "@/types/database";

function formatDetected(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatMetadataBlock(metadata: Json): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const keys = Object.keys(metadata as object);
  if (keys.length === 0) {
    return null;
  }
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return null;
  }
}

function bandStripeClass(band: ReturnType<typeof signalBand>) {
  if (band === "high") {
    return "border-l-[3px] border-l-[var(--signal-high)]";
  }
  if (band === "medium") {
    return "border-l-[3px] border-l-[var(--signal-med)]";
  }
  return "border-l-[3px] border-l-transparent";
}

export function EventDetailView({
  orgSlug,
  entityId,
  entityName,
  event,
}: {
  orgSlug: string;
  entityId: string;
  entityName: string;
  event: IntelligenceEventRow;
}) {
  const band = signalBand(event.signal_score);
  const backHref = entitySignalsHref(orgSlug, entityId);
  const hasAiMeta = parseEventAiMetadata(event.metadata) !== null;
  const metadataBlock =
    !hasAiMeta ? formatMetadataBlock(event.metadata) : null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Back to signals · {entityName}
        </Link>
      </div>

      <Surface
        variant="default"
        className={cn("space-y-6 p-6 sm:p-8", bandStripeClass(band))}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
              <Badge variant="secondary">
                {EVENT_TYPE_LABEL[
                  event.event_type as keyof typeof EVENT_TYPE_LABEL
                ] ?? event.event_type}
              </Badge>
              <Badge variant="outline" className="font-mono font-normal">
                {event.signal_score}
              </Badge>
              {event.is_dismissed ? (
                <span className="text-muted-foreground">Dismissed</span>
              ) : null}
            </div>
            <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground sm:text-[1.65rem]">
              {event.title}
            </h1>
            <p className="font-mono text-[12px] text-muted-foreground">
              Detected {formatDetected(event.detected_at)}
            </p>
          </div>
          <EventDetailActions
            orgSlug={orgSlug}
            entityId={entityId}
            event={event}
          />
        </div>

        <Separator className="opacity-60" />

        <section className="space-y-2">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Summary
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-foreground">
            {event.summary}
          </p>
        </section>

        {event.implication?.trim() ? (
          <section className="space-y-2">
            <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Strategic implication
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {event.implication}
            </p>
            <p className="text-[12px] text-muted-foreground">
              Inferred interpretation — verify against the primary source.
            </p>
          </section>
        ) : null}

        <EventIntelligenceMeta metadata={event.metadata} />

        {event.raw_content?.trim() ? (
          <section className="space-y-2">
            <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Raw excerpt
            </h2>
            <pre className="max-h-80 overflow-auto rounded-lg border border-border/60 bg-muted/30 p-4 text-[13px] leading-relaxed whitespace-pre-wrap text-foreground">
              {event.raw_content}
            </pre>
          </section>
        ) : null}

        <section className="grid gap-6 sm:grid-cols-2">
          <Meta label="Source type">
            {SOURCE_TYPE_LABEL[
              event.source_type as keyof typeof SOURCE_TYPE_LABEL
            ] ?? event.source_type}
          </Meta>
          <Meta label="Source URL">
            {event.source_url?.trim() ? (
              <a
                href={event.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 break-all text-primary underline-offset-4 hover:underline"
              >
                {event.source_url}
                <ExternalLink className="size-3.5 shrink-0" />
              </a>
            ) : (
              "—"
            )}
          </Meta>
          {event.published_at ? (
            <Meta label="Published">
              {formatDetected(event.published_at)}
            </Meta>
          ) : null}
        </section>

        {metadataBlock ? (
          <section className="space-y-2">
            <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Metadata
            </h2>
            <pre className="max-h-64 overflow-auto rounded-lg border border-border/60 bg-muted/25 p-4 font-mono text-[12px] leading-relaxed text-foreground">
              {metadataBlock}
            </pre>
          </section>
        ) : null}

        <Separator className="opacity-60" />

        <section className="space-y-3">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Signal score override
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Override the automated score when you have context the pipeline
            does not.
          </p>
          <EventSignalScoreForm
            orgSlug={orgSlug}
            entityId={entityId}
            eventId={event.id}
            initialScore={event.signal_score}
          />
        </section>
      </Surface>
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}
