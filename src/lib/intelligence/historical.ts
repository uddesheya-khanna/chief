import type { SupabaseClient } from "@supabase/supabase-js";

import { summarySimilarity } from "@/lib/ingestion/dedup";
import type { IntelligenceEventRow } from "@/modules/events/loaders";
import type { Database } from "@/types/database";

type Db = SupabaseClient<Database>;

export type RecurringTheme = {
  eventType: string;
  label: string;
  count: number;
  windowDays: number;
  sampleEventIds: string[];
  avgSignalScore: number;
};

export type EntityTrendGroup = {
  month: string;
  eventCount: number;
  avgSignalScore: number;
  dominantEventType: string | null;
};

export type RelatedEventLink = {
  toEventId: string;
  relationshipType: string;
  title: string;
  detectedAt: string;
};

const RECURRING_MIN_COUNT = 3;
const RECURRING_WINDOW_DAYS = 90;

export function detectRecurringThemes(
  events: IntelligenceEventRow[],
  windowDays = RECURRING_WINDOW_DAYS,
): RecurringTheme[] {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => new Date(e.detected_at).getTime() >= cutoff);

  const byType = new Map<string, IntelligenceEventRow[]>();
  for (const event of recent) {
    const list = byType.get(event.event_type) ?? [];
    list.push(event);
    byType.set(event.event_type, list);
  }

  const themes: RecurringTheme[] = [];

  for (const [eventType, group] of byType) {
    if (group.length < RECURRING_MIN_COUNT) {
      continue;
    }
    const avg =
      group.reduce((s, e) => s + e.signal_score, 0) / group.length;
    themes.push({
      eventType,
      label: eventType.replace(/_/g, " "),
      count: group.length,
      windowDays,
      sampleEventIds: group.slice(0, 5).map((e) => e.id),
      avgSignalScore: Math.round(avg),
    });
  }

  return themes.sort((a, b) => b.count - a.count);
}

export function groupEventsByMonth(
  events: IntelligenceEventRow[],
): EntityTrendGroup[] {
  const buckets = new Map<string, IntelligenceEventRow[]>();

  for (const event of events) {
    const month = event.detected_at.slice(0, 7);
    const list = buckets.get(month) ?? [];
    list.push(event);
    buckets.set(month, list);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, group]) => {
      const typeCounts = new Map<string, number>();
      let scoreSum = 0;
      for (const e of group) {
        typeCounts.set(e.event_type, (typeCounts.get(e.event_type) ?? 0) + 1);
        scoreSum += e.signal_score;
      }
      let dominant: string | null = null;
      let max = 0;
      for (const [t, c] of typeCounts) {
        if (c > max) {
          max = c;
          dominant = t;
        }
      }
      return {
        month,
        eventCount: group.length,
        avgSignalScore: Math.round(scoreSum / group.length),
        dominantEventType: dominant,
      };
    });
}

export async function syncRecurringEventRelationships(
  supabase: Db,
  organizationId: string,
  entityId: string,
  events: IntelligenceEventRow[],
): Promise<number> {
  const themes = detectRecurringThemes(events);
  let linked = 0;

  for (const theme of themes) {
    const ids = theme.sampleEventIds;
    if (ids.length < 2) {
      continue;
    }
    const anchorId = ids[0];
    for (let i = 1; i < ids.length; i += 1) {
      const toId = ids[i];
      const { error } = await supabase.from("event_relationships").upsert(
        {
          organization_id: organizationId,
          from_event_id: anchorId,
          to_event_id: toId,
          relationship_type: "recurring_theme",
          metadata: { event_type: theme.eventType, theme_count: theme.count },
        },
        {
          onConflict:
            "organization_id,from_event_id,to_event_id,relationship_type",
          ignoreDuplicates: true,
        },
      );
      if (!error) {
        linked += 1;
      }
    }
  }

  return linked;
}

export async function suggestRelatedEvents(
  supabase: Db,
  organizationId: string,
  event: IntelligenceEventRow,
  limit = 5,
): Promise<RelatedEventLink[]> {
  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("intelligence_events")
    .select("id, title, summary, event_type, detected_at")
    .eq("organization_id", organizationId)
    .eq("entity_id", event.entity_id)
    .neq("id", event.id)
    .gte("detected_at", since)
    .order("detected_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[intelligence:historical:related]", error.message);
    return [];
  }

  const probe = `${event.title} ${event.summary}`;
  const scored = (data ?? [])
    .map((row) => ({
      row,
      similarity: summarySimilarity(probe, `${row.title} ${row.summary}`),
    }))
    .filter((s) => s.similarity >= 0.35)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored.map(({ row }) => ({
    toEventId: row.id,
    relationshipType: "related",
    title: row.title,
    detectedAt: row.detected_at,
  }));
}

export function detectStrategicShift(
  trendGroups: EntityTrendGroup[],
): { detected: boolean; message: string } | null {
  if (trendGroups.length < 3) {
    return null;
  }

  const recent = trendGroups[0];
  const prior = trendGroups.slice(1, 4);
  const priorAvg =
    prior.reduce((s, g) => s + g.eventCount, 0) / prior.length;

  if (recent.eventCount >= priorAvg * 2 && recent.eventCount >= 4) {
    return {
      detected: true,
      message: `Activity accelerated in ${recent.month}: ${recent.eventCount} signals vs ~${Math.round(priorAvg)} prior monthly average.`,
    };
  }

  if (
    recent.dominantEventType &&
    prior.every((p) => p.dominantEventType && p.dominantEventType !== recent.dominantEventType)
  ) {
    return {
      detected: true,
      message: `Dominant signal type shifted to ${recent.dominantEventType.replace(/_/g, " ")} in ${recent.month}.`,
    };
  }

  return null;
}
