import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Db = SupabaseClient<Database>;

const EVENT_AGG_COLUMNS =
  "id, entity_id, event_type, title, summary, implication, signal_score, detected_at, source_type";

export type EventSummarySlice = {
  id: string;
  entityId: string;
  eventType: string;
  title: string;
  summary: string;
  implication: string | null;
  signalScore: number;
  detectedAt: string;
};

export type EntityIntelligenceSummary = {
  entityId: string;
  entityName: string;
  entityType: string;
  signalCount: number;
  avgSignalScore: number;
  topEvent: EventSummarySlice | null;
  highlights: string[];
  eventTypeBreakdown: Record<string, number>;
};

export type WeeklyDigestSlice = {
  periodStart: string;
  periodEnd: string;
  totalSignals: number;
  topSignals: EventSummarySlice[];
  entitySummaries: EntityIntelligenceSummary[];
  eventTypeTotals: Record<string, number>;
};

export type HistoricalComparison = {
  currentPeriod: { start: string; end: string; count: number; avgScore: number };
  previousPeriod: { start: string; end: string; count: number; avgScore: number };
  deltaCount: number;
  deltaAvgScore: number;
};

function periodBounds(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function fetchTopSignalsForPeriod(
  supabase: Db,
  organizationId: string,
  startIso: string,
  endIso: string,
  limit = 20,
): Promise<EventSummarySlice[]> {
  const { data, error } = await supabase
    .from("intelligence_events")
    .select(EVENT_AGG_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("is_dismissed", false)
    .gte("detected_at", startIso)
    .lte("detected_at", endIso)
    .order("signal_score", { ascending: false })
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[intelligence:aggregate:top]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    entityId: row.entity_id,
    eventType: row.event_type,
    title: row.title,
    summary: row.summary,
    implication: row.implication,
    signalScore: row.signal_score,
    detectedAt: row.detected_at,
  }));
}

export async function buildEntityIntelligenceSummary(
  supabase: Db,
  organizationId: string,
  entityId: string,
  days = 90,
): Promise<EntityIntelligenceSummary | null> {
  const { start, end } = periodBounds(days);

  const [entityRes, eventsRes] = await Promise.all([
    supabase
      .from("tracked_entities")
      .select("id, name, type")
      .eq("organization_id", organizationId)
      .eq("id", entityId)
      .maybeSingle(),
    supabase
      .from("intelligence_events")
      .select(EVENT_AGG_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("entity_id", entityId)
      .eq("is_dismissed", false)
      .gte("detected_at", start)
      .lte("detected_at", end)
      .order("signal_score", { ascending: false })
      .limit(50),
  ]);

  if (entityRes.error || !entityRes.data) {
    return null;
  }

  const events = eventsRes.data ?? [];
  const breakdown: Record<string, number> = {};
  let scoreSum = 0;

  for (const e of events) {
    breakdown[e.event_type] = (breakdown[e.event_type] ?? 0) + 1;
    scoreSum += e.signal_score;
  }

  const top = events[0];
  const highlights = events
    .slice(0, 3)
    .map((e) => e.title)
    .filter(Boolean);

  return {
    entityId: entityRes.data.id,
    entityName: entityRes.data.name,
    entityType: entityRes.data.type,
    signalCount: events.length,
    avgSignalScore:
      events.length > 0 ? Math.round(scoreSum / events.length) : 0,
    topEvent: top
      ? {
          id: top.id,
          entityId: top.entity_id,
          eventType: top.event_type,
          title: top.title,
          summary: top.summary,
          implication: top.implication,
          signalScore: top.signal_score,
          detectedAt: top.detected_at,
        }
      : null,
    highlights,
    eventTypeBreakdown: breakdown,
  };
}

export async function buildWeeklyDigestQuery(
  supabase: Db,
  organizationId: string,
): Promise<WeeklyDigestSlice> {
  const { start, end } = periodBounds(7);
  const topSignals = await fetchTopSignalsForPeriod(
    supabase,
    organizationId,
    start,
    end,
    15,
  );

  const { data: entities } = await supabase
    .from("tracked_entities")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .limit(30);

  const entitySummaries: EntityIntelligenceSummary[] = [];
  for (const entity of entities ?? []) {
    const summary = await buildEntityIntelligenceSummary(
      supabase,
      organizationId,
      entity.id,
      7,
    );
    if (summary && summary.signalCount > 0) {
      entitySummaries.push(summary);
    }
  }

  entitySummaries.sort((a, b) => b.signalCount - a.signalCount);

  const eventTypeTotals: Record<string, number> = {};
  for (const signal of topSignals) {
    eventTypeTotals[signal.eventType] =
      (eventTypeTotals[signal.eventType] ?? 0) + 1;
  }

  const { count } = await supabase
    .from("intelligence_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_dismissed", false)
    .gte("detected_at", start)
    .lte("detected_at", end);

  return {
    periodStart: start,
    periodEnd: end,
    totalSignals: count ?? topSignals.length,
    topSignals,
    entitySummaries: entitySummaries.slice(0, 12),
    eventTypeTotals,
  };
}

export async function compareIntelligencePeriods(
  supabase: Db,
  organizationId: string,
  periodDays = 7,
): Promise<HistoricalComparison> {
  const currentEnd = new Date();
  const currentStart = new Date(
    currentEnd.getTime() - periodDays * 24 * 60 * 60 * 1000,
  );
  const previousEnd = new Date(currentStart.getTime());
  const previousStart = new Date(
    previousEnd.getTime() - periodDays * 24 * 60 * 60 * 1000,
  );

  async function periodStats(start: Date, end: Date) {
    const { data, count, error } = await supabase
      .from("intelligence_events")
      .select("signal_score")
      .eq("organization_id", organizationId)
      .eq("is_dismissed", false)
      .gte("detected_at", start.toISOString())
      .lt("detected_at", end.toISOString());

    if (error) {
      console.error("[intelligence:aggregate:compare]", error.message);
      return { count: 0, avgScore: 0 };
    }

    const rows = data ?? [];
    const avg =
      rows.length > 0
        ? rows.reduce((s, r) => s + r.signal_score, 0) / rows.length
        : 0;

    return { count: count ?? rows.length, avgScore: Math.round(avg) };
  }

  const [current, previous] = await Promise.all([
    periodStats(currentStart, currentEnd),
    periodStats(previousStart, previousEnd),
  ]);

  return {
    currentPeriod: {
      start: currentStart.toISOString(),
      end: currentEnd.toISOString(),
      count: current.count,
      avgScore: current.avgScore,
    },
    previousPeriod: {
      start: previousStart.toISOString(),
      end: previousEnd.toISOString(),
      count: previous.count,
      avgScore: previous.avgScore,
    },
    deltaCount: current.count - previous.count,
    deltaAvgScore: current.avgScore - previous.avgScore,
  };
}
