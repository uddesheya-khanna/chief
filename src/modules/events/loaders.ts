import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const EVENT_LIST_COLUMNS =
  "id, organization_id, entity_id, source_url, source_type, event_type, title, summary, implication, signal_score, metadata, is_dismissed, dismissed_at, dismissed_by, detected_at, published_at, created_at";

export type IntelligenceEventRow =
  Database["public"]["Tables"]["intelligence_events"]["Row"];

export async function listIntelligenceEventsForEntity(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  entityId: string,
  options?: { includeDismissed?: boolean; limit?: number },
): Promise<IntelligenceEventRow[]> {
  const includeDismissed = options?.includeDismissed ?? false;
  const limit = options?.limit ?? 200;

  let qb = supabase
    .from("intelligence_events")
    .select(EVENT_LIST_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("entity_id", entityId)
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (!includeDismissed) {
    qb = qb.eq("is_dismissed", false);
  }

  const { data, error } = await qb;

  if (error) {
    console.error("[events:listForEntity]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getIntelligenceEvent(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  eventId: string,
): Promise<IntelligenceEventRow | null> {
  const { data, error } = await supabase
    .from("intelligence_events")
    .select(EVENT_LIST_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    console.error("[events:get]", error.message);
    return null;
  }
  return data;
}
