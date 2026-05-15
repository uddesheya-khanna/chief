import { embedTexts } from "@/lib/embeddings/client";
import { formatEmbeddingVector } from "@/lib/embeddings/format";
import { summarySimilarity } from "@/lib/ingestion/dedup";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const EMBEDDING_DEDUP_THRESHOLD = 0.92;
const EMBEDDING_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Semantic dedup via pgvector when embeddings exist; falls back to token similarity.
 */
export async function findSimilarByEmbedding(params: {
  organizationId: string;
  entityId: string;
  title: string;
  summary: string;
}): Promise<{ id: string; similarity: number } | null> {
  const probe = `${params.title} ${params.summary}`.trim();
  if (!probe) {
    return null;
  }

  const embedResult = await embedTexts([probe]);
  if (!embedResult.ok) {
    return null;
  }

  const vector = embedResult.vectors[0];
  if (!vector) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const formatted = formatEmbeddingVector(vector);
  if (!formatted) {
    return null;
  }

  const { data, error } = await supabase.rpc("match_intelligence_embeddings", {
    p_organization_id: params.organizationId,
    p_query_embedding: formatted,
    p_match_count: 12,
    p_min_similarity: EMBEDDING_DEDUP_THRESHOLD,
  });

  if (error) {
    console.error("[dedup:embedding]", error.message);
    return null;
  }

  const since = new Date(Date.now() - EMBEDDING_DEDUP_WINDOW_MS).toISOString();

  for (const row of data ?? []) {
    if (row.source_type !== "event") {
      continue;
    }

    const { data: event } = await supabase
      .from("intelligence_events")
      .select("id, entity_id, detected_at")
      .eq("id", row.source_id)
      .eq("organization_id", params.organizationId)
      .maybeSingle();

    if (
      !event ||
      event.entity_id !== params.entityId ||
      event.detected_at < since
    ) {
      continue;
    }

    console.log("[dedup:embedding]", {
      entityId: params.entityId,
      matchId: event.id,
      similarity: row.semantic_similarity,
    });

    return { id: event.id, similarity: row.semantic_similarity };
  }

  return null;
}

const SAME_TYPE_WINDOW_MS = 60 * 60 * 1000;

export async function findSimilarRecentEventWithEmbeddings(params: {
  organizationId: string;
  entityId: string;
  eventType: string;
  summary: string;
  title: string;
}): Promise<{ id: string; similarity: number } | null> {
  const supabase = createSupabaseServiceClient();
  const typeSince = new Date(Date.now() - SAME_TYPE_WINDOW_MS).toISOString();
  const { data: sameType } = await supabase
    .from("intelligence_events")
    .select("id, detected_at")
    .eq("organization_id", params.organizationId)
    .eq("entity_id", params.entityId)
    .eq("event_type", params.eventType)
    .gte("detected_at", typeSince)
    .order("detected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sameType) {
    return { id: sameType.id, similarity: 1 };
  }

  const embeddingMatch = await findSimilarByEmbedding({
    organizationId: params.organizationId,
    entityId: params.entityId,
    title: params.title,
    summary: params.summary,
  });
  if (embeddingMatch) {
    return embeddingMatch;
  }

  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("intelligence_events")
    .select("id, title, summary, event_type, detected_at")
    .eq("organization_id", params.organizationId)
    .eq("entity_id", params.entityId)
    .gte("detected_at", since)
    .order("detected_at", { ascending: false })
    .limit(8);

  const probe = `${params.title} ${params.summary}`;
  for (const row of data ?? []) {
    const similarity = summarySimilarity(
      probe,
      `${row.title ?? ""} ${row.summary ?? ""}`,
    );
    if (similarity >= 0.72) {
      return { id: row.id, similarity };
    }
  }

  return null;
}
