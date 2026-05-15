import type { SupabaseClient } from "@supabase/supabase-js";

import { generateExecutiveDigest } from "@/lib/ai/pipelines/generate-digest";
import {
  buildWeeklyDigestQuery,
  fetchTopSignalsForPeriod,
  type EventSummarySlice,
} from "@/lib/intelligence/aggregate";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/types/database";

type Db = SupabaseClient<Database>;

export type DigestType =
  | "daily"
  | "weekly"
  | "high_signal"
  | "competitor_watch";

export type DigestContent = {
  executive_summary: string;
  key_movements: { heading: string; body: string }[];
  recommended_actions: string[];
  top_signals: (EventSummarySlice & { entityName?: string })[];
  event_type_totals: Record<string, number>;
  confidence: number;
  period_start: string;
  period_end: string;
};

function periodBounds(days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function generateAndStoreDigest(params: {
  organizationId: string;
  workspaceName: string;
  digestType: DigestType;
  periodDays: number;
  minSignalScore?: number;
  entityTypeFilter?: string;
}): Promise<{ digestId: string } | { error: string }> {
  const supabase = createSupabaseServiceClient();
  const { start, end } = periodBounds(params.periodDays);

  let signals = await fetchTopSignalsForPeriod(
    supabase,
    params.organizationId,
    start,
    end,
    25,
  );

  if (params.minSignalScore != null) {
    const minScore = params.minSignalScore;
    signals = signals.filter((s) => s.signalScore >= minScore);
  }

  if (params.entityTypeFilter) {
    const entityIds = await resolveEntityIdsByType(
      supabase,
      params.organizationId,
      params.entityTypeFilter,
    );
    const set = new Set(entityIds);
    signals = signals.filter((s) => set.has(s.entityId));
  }

  const eventTypeTotals: Record<string, number> = {};
  for (const s of signals) {
    eventTypeTotals[s.eventType] = (eventTypeTotals[s.eventType] ?? 0) + 1;
  }

  const ai = await generateExecutiveDigest({
    digestType: params.digestType,
    periodLabel: `${start.slice(0, 10)} — ${end.slice(0, 10)}`,
    workspaceName: params.workspaceName,
    signals,
  });

  const title = digestTitle(params.digestType, params.periodDays);

  const content: Json = {
    executive_summary: ai.executive_summary,
    key_movements: ai.key_movements,
    recommended_actions: ai.recommended_actions,
    top_signals: signals,
    event_type_totals: eventTypeTotals,
    confidence: ai.confidence,
    period_start: start,
    period_end: end,
  } satisfies DigestContent as unknown as Json;

  const { data, error } = await supabase
    .from("intelligence_digests")
    .insert({
      organization_id: params.organizationId,
      digest_type: params.digestType,
      title,
      period_start: start,
      period_end: end,
      content,
      status: "complete",
      generated_by: "system",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[delivery:digest:store]", error?.message);
    return { error: error?.message ?? "Failed to store digest" };
  }

  console.log("[delivery:digest]", {
    organizationId: params.organizationId,
    digestType: params.digestType,
    digestId: data.id,
    signalCount: signals.length,
  });

  return { digestId: data.id };
}

export async function generateWeeklyStrategicDigest(
  organizationId: string,
  workspaceName: string,
): Promise<{ digestId: string } | { error: string }> {
  const supabase = createSupabaseServiceClient();
  const slice = await buildWeeklyDigestQuery(supabase, organizationId);

  const ai = await generateExecutiveDigest({
    digestType: "weekly",
    periodLabel: `${slice.periodStart.slice(0, 10)} — ${slice.periodEnd.slice(0, 10)}`,
    workspaceName,
    signals: slice.topSignals,
  });

  const content: Json = {
    executive_summary: ai.executive_summary,
    key_movements: ai.key_movements,
    recommended_actions: ai.recommended_actions,
    top_signals: slice.topSignals,
    entity_summaries: slice.entitySummaries,
    event_type_totals: slice.eventTypeTotals,
    confidence: ai.confidence,
    period_start: slice.periodStart,
    period_end: slice.periodEnd,
    total_signals: slice.totalSignals,
  };

  const { data, error } = await supabase
    .from("intelligence_digests")
    .insert({
      organization_id: organizationId,
      digest_type: "weekly",
      title: `Weekly strategic movement — ${slice.periodEnd.slice(0, 10)}`,
      period_start: slice.periodStart,
      period_end: slice.periodEnd,
      content,
      status: "complete",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to store weekly digest" };
  }

  return { digestId: data.id };
}

function digestTitle(type: DigestType, periodDays: number): string {
  const label = type.replace(/_/g, " ");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} digest (${periodDays}d)`;
}

async function resolveEntityIdsByType(
  supabase: Db,
  organizationId: string,
  entityType: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("tracked_entities")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("type", entityType)
    .eq("is_active", true);

  return data?.map((r) => r.id) ?? [];
}
