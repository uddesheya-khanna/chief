/**
 * Embedding generation jobs — invoked after intelligence events are persisted.
 */

import { persistEntityEmbeddings, persistEventEmbeddings } from "@/lib/embeddings";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const EVENT_COLUMNS =
  "id, organization_id, title, summary, implication";

const ENTITY_COLUMNS =
  "id, organization_id, name, type, description, domain";

export async function embedIntelligenceEvent(eventId: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("intelligence_events")
    .select(EVENT_COLUMNS)
    .eq("id", eventId)
    .maybeSingle();

  if (error || !data) {
    console.error("[embeddings:job:event]", {
      eventId,
      error: error?.message ?? "not_found",
    });
    return;
  }

  const result = await persistEventEmbeddings(
    supabase,
    data.organization_id,
    data.id,
    {
      title: data.title,
      summary: data.summary,
      implication: data.implication,
    },
  );

  console.log("[embeddings:job:event]", {
    eventId,
    outcome: result.ok ? "success" : "failed",
    embedded: result.ok ? result.embedded : 0,
  });
}

export async function embedTrackedEntity(entityId: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("tracked_entities")
    .select(ENTITY_COLUMNS)
    .eq("id", entityId)
    .maybeSingle();

  if (error || !data) {
    console.error("[embeddings:job:entity]", {
      entityId,
      error: error?.message ?? "not_found",
    });
    return;
  }

  const result = await persistEntityEmbeddings(
    supabase,
    data.organization_id,
    data.id,
    {
      name: data.name,
      type: data.type,
      description: data.description,
      domain: data.domain,
    },
  );

  console.log("[embeddings:job:entity]", {
    entityId,
    outcome: result.ok ? "success" : "failed",
    embedded: result.ok ? result.embedded : 0,
  });
}

const BACKFILL_BATCH = 25;

export async function backfillOrganizationEmbeddings(
  organizationId: string,
): Promise<{ events: number; entities: number }> {
  const supabase = createSupabaseServiceClient();

  const { data: events } = await supabase
    .from("intelligence_events")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_dismissed", false)
    .order("detected_at", { ascending: false })
    .limit(BACKFILL_BATCH);

  const { data: entities } = await supabase
    .from("tracked_entities")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .limit(BACKFILL_BATCH);

  for (const row of events ?? []) {
    await embedIntelligenceEvent(row.id);
  }
  for (const row of entities ?? []) {
    await embedTrackedEntity(row.id);
  }

  return {
    events: events?.length ?? 0,
    entities: entities?.length ?? 0,
  };
}
