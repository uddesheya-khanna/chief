import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EVENT_TYPE_LABEL,
  SOURCE_TYPE_LABEL,
  signalBand,
} from "@/modules/events/constants";
import { entitySignalDetailHref } from "@/modules/events/event-url";
import type { IntelligenceEventRow } from "@/modules/events/loaders";
import { dismissIntelligenceEvent } from "@/actions/events";

function formatDetected(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function scoreDotClass(band: ReturnType<typeof signalBand>) {
  if (band === "high") {
    return "bg-[var(--signal-high)]";
  }
  if (band === "medium") {
    return "bg-[var(--signal-med)]";
  }
  return "bg-muted-foreground/50";
}

export function SignalsDataTable({
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
          No signals recorded
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          When intelligence events exist for this entity, they are listed here
          with scores and types for quick scanning.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="h-12 w-[100px] text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Score
            </TableHead>
            <TableHead className="h-12 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Type
            </TableHead>
            <TableHead className="h-12 max-w-[14rem] text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Implication
            </TableHead>
            <TableHead className="h-12 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Title
            </TableHead>
            <TableHead className="h-12 hidden text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground md:table-cell">
              Source
            </TableHead>
            <TableHead className="h-12 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Detected
            </TableHead>
            <TableHead className="h-12 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="h-12 w-[140px] text-right text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((ev) => {
            const band = signalBand(ev.signal_score);
            const detailHref = entitySignalDetailHref(orgSlug, entityId, ev.id);
            return (
              <TableRow
                key={ev.id}
                className="group h-[52px] border-border/50 hover:bg-muted/30"
              >
                <TableCell className="align-middle font-mono text-[13px] tabular-nums">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        scoreDotClass(band),
                      )}
                      aria-hidden
                    />
                    {ev.signal_score}
                  </span>
                </TableCell>
                <TableCell className="align-middle">
                  <Badge variant="secondary" className="font-normal">
                    {EVENT_TYPE_LABEL[
                      ev.event_type as keyof typeof EVENT_TYPE_LABEL
                    ] ?? ev.event_type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[14rem] align-middle text-[13px] text-muted-foreground">
                  {ev.implication?.trim() ? (
                    <span className="line-clamp-2">{ev.implication}</span>
                  ) : (
                    <span className="text-muted-foreground/70">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[min(40vw,24rem)] align-middle text-sm text-foreground">
                  <Link
                    href={detailHref}
                    className="line-clamp-2 font-medium underline-offset-4 hover:underline"
                  >
                    {ev.title}
                  </Link>
                </TableCell>
                <TableCell className="hidden align-middle text-[13px] text-muted-foreground md:table-cell">
                  {ev.source_url?.trim()
                    ? "Link"
                    : SOURCE_TYPE_LABEL[
                        ev.source_type as keyof typeof SOURCE_TYPE_LABEL
                      ] ?? ev.source_type}
                </TableCell>
                <TableCell className="align-middle font-mono text-[12px] text-muted-foreground tabular-nums">
                  {formatDetected(ev.detected_at)}
                </TableCell>
                <TableCell className="align-middle text-[13px]">
                  {ev.is_dismissed ? (
                    <span className="text-muted-foreground">Dismissed</span>
                  ) : (
                    <span className="text-foreground">Active</span>
                  )}
                </TableCell>
                <TableCell className="align-middle text-right">
                  <div className="flex flex-wrap justify-end gap-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    <Link
                      href={detailHref}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "h-8 px-2",
                      )}
                    >
                      View
                    </Link>
                    {!ev.is_dismissed ? (
                      <form action={dismissIntelligenceEvent}>
                        <input type="hidden" name="orgSlug" value={orgSlug} />
                        <input type="hidden" name="entityId" value={entityId} />
                        <input type="hidden" name="eventId" value={ev.id} />
                        <button
                          type="submit"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-8",
                          )}
                        >
                          Dismiss
                        </button>
                      </form>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
