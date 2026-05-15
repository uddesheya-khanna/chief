import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  detectRecurringThemes,
  detectStrategicShift,
  groupEventsByMonth,
  type RecurringTheme,
} from "@/lib/intelligence/historical";
import { EVENT_TYPE_LABEL } from "@/modules/events/constants";
import { entitySignalDetailHref } from "@/modules/events/event-url";
import type { IntelligenceEventRow } from "@/modules/events/loaders";

export function EntityMemoryPanel({
  orgSlug,
  entityId,
  events,
}: {
  orgSlug: string;
  entityId: string;
  events: IntelligenceEventRow[];
}) {
  const themes = detectRecurringThemes(events);
  const trends = groupEventsByMonth(events);
  const shift = detectStrategicShift(trends);

  if (themes.length === 0 && trends.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-lg border border-border/70 bg-muted/10 p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Historical memory
        </h2>
        <p className="text-sm text-muted-foreground">
          Recurring patterns and longitudinal activity for this entity.
        </p>
      </div>

      {shift?.detected ? (
        <div className="flex gap-2 rounded-md border border-border/60 bg-card/50 px-3 py-2.5 text-sm">
          <TrendingUp
            className="mt-0.5 size-4 shrink-0 text-[var(--signal-high)]"
            aria-hidden
          />
          <p className="text-foreground/90">{shift.message}</p>
        </div>
      ) : null}

      {themes.length > 0 ? (
        <RecurringThemesList
          orgSlug={orgSlug}
          entityId={entityId}
          themes={themes}
        />
      ) : null}

      {trends.length > 0 ? (
        <TrendGroupsTable trends={trends} />
      ) : null}
    </section>
  );
}

function RecurringThemesList({
  orgSlug,
  entityId,
  themes,
}: {
  orgSlug: string;
  entityId: string;
  themes: RecurringTheme[];
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-foreground">Recurring themes</h3>
      <ul className="mt-2 space-y-2">
        {themes.map((theme) => (
          <li
            key={theme.eventType}
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            <Badge variant="secondary" className="font-normal">
              {EVENT_TYPE_LABEL[
                theme.eventType as keyof typeof EVENT_TYPE_LABEL
              ] ?? theme.label}
            </Badge>
            <span className="text-muted-foreground">
              {theme.count} signals · {theme.windowDays}d · avg score{" "}
              {theme.avgSignalScore}
            </span>
            {theme.sampleEventIds[0] ? (
              <Link
                href={entitySignalDetailHref(
                  orgSlug,
                  entityId,
                  theme.sampleEventIds[0],
                )}
                className="text-[12px] text-foreground/80 underline-offset-2 hover:underline"
              >
                View sample
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendGroupsTable({
  trends,
}: {
  trends: ReturnType<typeof groupEventsByMonth>;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-foreground">Activity by month</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border/60 text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Month</th>
              <th className="py-2 pr-4 font-medium">Signals</th>
              <th className="py-2 pr-4 font-medium">Avg score</th>
              <th className="py-2 font-medium">Dominant type</th>
            </tr>
          </thead>
          <tbody>
            {trends.slice(0, 8).map((row) => (
              <tr key={row.month} className="border-b border-border/40">
                <td className="py-2.5 pr-4 font-mono tabular-nums">{row.month}</td>
                <td className="py-2.5 pr-4 tabular-nums">{row.eventCount}</td>
                <td className="py-2.5 pr-4 font-mono tabular-nums">
                  {row.avgSignalScore}
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {row.dominantEventType
                    ? (EVENT_TYPE_LABEL[
                        row.dominantEventType as keyof typeof EVENT_TYPE_LABEL
                      ] ?? row.dominantEventType)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

