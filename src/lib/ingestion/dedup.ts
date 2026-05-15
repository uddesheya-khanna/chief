import { createSupabaseServiceClient } from "@/lib/supabase/service";

const DUPLICATE_URL_WINDOW_MS = 24 * 60 * 60 * 1000;
const SAME_TYPE_WINDOW_MS = 60 * 60 * 1000;
const SIMILAR_SUMMARY_WINDOW_MS = 6 * 60 * 60 * 1000;

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text: string): Set<string> {
  const tokens = normalizeForComparison(text)
    .split(" ")
    .filter((t) => t.length > 3);
  return new Set(tokens);
}

/** Jaccard similarity on word tokens — lightweight, no embeddings. */
export function summarySimilarity(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection += 1;
    }
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export async function hasRecentDuplicateUrl(
  organizationId: string,
  entityId: string,
  sourceUrl: string,
): Promise<boolean> {
  const since = new Date(Date.now() - DUPLICATE_URL_WINDOW_MS).toISOString();
  const supabase = createSupabaseServiceClient();

  const { count, error } = await supabase
    .from("intelligence_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("entity_id", entityId)
    .eq("source_url", sourceUrl)
    .gte("detected_at", since);

  if (error) {
    console.error("[dedup:url]", error.message);
    return false;
  }

  return (count ?? 0) > 0;
}

export async function findSimilarRecentEvent(params: {
  organizationId: string;
  entityId: string;
  eventType: string;
  summary: string;
  title: string;
}): Promise<{ id: string; similarity: number } | null> {
  const since = new Date(Date.now() - SIMILAR_SUMMARY_WINDOW_MS).toISOString();
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("intelligence_events")
    .select("id, title, summary, event_type, detected_at")
    .eq("organization_id", params.organizationId)
    .eq("entity_id", params.entityId)
    .gte("detected_at", since)
    .order("detected_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("[dedup:similar]", error.message);
    return null;
  }

  const probe = `${params.title} ${params.summary}`;

  for (const row of data ?? []) {
    if (row.event_type === params.eventType) {
      const typeSince = new Date(Date.now() - SAME_TYPE_WINDOW_MS).toISOString();
      if (row.detected_at >= typeSince) {
        console.log("[dedup:similar]", {
          reason: "same_type_within_hour",
          entityId: params.entityId,
          eventType: params.eventType,
        });
        return { id: row.id, similarity: 1 };
      }
    }

    const similarity = summarySimilarity(
      probe,
      `${row.title ?? ""} ${row.summary ?? ""}`,
    );
    if (similarity >= 0.72) {
      console.log("[dedup:similar]", {
        reason: "summary_overlap",
        entityId: params.entityId,
        similarity: Number(similarity.toFixed(2)),
        matchId: row.id,
      });
      return { id: row.id, similarity };
    }
  }

  return null;
}

export function shouldSuppressLowQualityEvent(params: {
  isSignificant: boolean;
  confidence: number;
  changeRatio: number;
}): boolean {
  if (params.isSignificant) {
    return false;
  }
  return params.confidence < 0.4 && params.changeRatio < 0.06;
}
