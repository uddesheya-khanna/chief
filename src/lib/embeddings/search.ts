import type { SupabaseClient } from "@supabase/supabase-js";

import { embedQuery } from "@/lib/embeddings/client";
import { formatEmbeddingVector } from "@/lib/embeddings/format";
import {
  computeCompositeScore,
  dedupeSearchHits,
} from "@/lib/embeddings/ranking";
import type { RankedSearchHit } from "@/lib/embeddings/types";
import type { EntityType } from "@/modules/entities/constants";
import type { EventType } from "@/modules/events/constants";
import type { Database } from "@/types/database";

const EVENT_SEARCH_COLUMNS =
  "id, organization_id, entity_id, source_url, source_type, event_type, title, summary, implication, signal_score, detected_at, is_dismissed";

const FEED_ENTITY_EMBED = "tracked_entities ( id, name, type, is_active )";

type Db = SupabaseClient<Database>;

export type HybridSearchParams = {
  organizationId: string;
  query: string;
  limit?: number;
  offset?: number;
  entityTypes?: EntityType[];
  eventTypes?: EventType[];
  minSignalScore?: number;
  includeDismissed?: boolean;
  entityIds?: string[];
};

export type HybridSearchResult = {
  hits: RankedSearchHit[];
  total: number;
  mode: "hybrid" | "keyword" | "semantic";
  queryEcho: string;
};

type SemanticMatch = {
  source_type: string;
  source_id: string;
  chunk_kind: string;
  semantic_similarity: number;
};

type EventRow = {
  id: string;
  entity_id: string;
  source_type: string;
  event_type: string;
  title: string;
  summary: string;
  implication: string | null;
  signal_score: number;
  detected_at: string;
  tracked_entities: { id: string; name: string; type: string; is_active: boolean } | null;
};

function sanitizeQuery(q: string): string {
  return q
    .replace(/\0/g, "")
    .trim()
    .slice(0, 500);
}

async function fetchSemanticMatches(
  supabase: Db,
  organizationId: string,
  queryVector: number[],
): Promise<Map<string, number>> {
  const formatted = formatEmbeddingVector(queryVector);
  if (!formatted) {
    return new Map();
  }

  const { data, error } = await supabase.rpc("match_intelligence_embeddings", {
    p_organization_id: organizationId,
    p_query_embedding: formatted,
    p_match_count: 60,
    p_min_similarity: 0.42,
  });

  if (error) {
    console.error("[embeddings:search:semantic]", error.message);
    return new Map();
  }

  const bestBySource = new Map<string, number>();
  for (const row of (data ?? []) as SemanticMatch[]) {
    if (row.source_type !== "event") {
      continue;
    }
    const prev = bestBySource.get(row.source_id) ?? 0;
    if (row.semantic_similarity > prev) {
      bestBySource.set(row.source_id, row.semantic_similarity);
    }
  }
  return bestBySource;
}

async function keywordSearchEvents(
  supabase: Db,
  params: HybridSearchParams,
): Promise<{ rows: EventRow[]; ranks: Map<string, number> }> {
  const q = sanitizeQuery(params.query);
  const tsQuery = q
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map((w) => w.replace(/[^\w-]/g, ""))
    .filter(Boolean)
    .join(" & ");

  let qb = supabase
    .from("intelligence_events")
    .select(`${EVENT_SEARCH_COLUMNS}, ${FEED_ENTITY_EMBED}`)
    .eq("organization_id", params.organizationId)
    .limit(80);

  if (!params.includeDismissed) {
    qb = qb.eq("is_dismissed", false);
  }
  if (params.minSignalScore != null) {
    qb = qb.gte("signal_score", params.minSignalScore);
  }
  if (params.eventTypes?.length) {
    qb = qb.in("event_type", params.eventTypes);
  }
  if (params.entityIds?.length) {
    qb = qb.in("entity_id", params.entityIds);
  }

  if (tsQuery) {
    qb = qb.textSearch("search_document", tsQuery, {
      type: "websearch",
      config: "english",
    });
  } else {
    qb = qb.ilike("title", `%${q.slice(0, 80)}%`);
  }

  const { data, error } = await qb.order("detected_at", { ascending: false });

  if (error) {
    console.error("[embeddings:search:keyword]", error.message);
    return { rows: [], ranks: new Map() };
  }

  const rows = (data ?? []) as EventRow[];
  const ranks = new Map<string, number>();
  rows.forEach((row, index) => {
    ranks.set(row.id, 1 - index / Math.max(rows.length, 1));
  });

  return { rows, ranks };
}

async function loadEventsByIds(
  supabase: Db,
  organizationId: string,
  eventIds: string[],
  params: HybridSearchParams,
): Promise<EventRow[]> {
  if (eventIds.length === 0) {
    return [];
  }

  let qb = supabase
    .from("intelligence_events")
    .select(`${EVENT_SEARCH_COLUMNS}, ${FEED_ENTITY_EMBED}`)
    .eq("organization_id", organizationId)
    .in("id", eventIds);

  if (!params.includeDismissed) {
    qb = qb.eq("is_dismissed", false);
  }
  if (params.minSignalScore != null) {
    qb = qb.gte("signal_score", params.minSignalScore);
  }
  if (params.eventTypes?.length) {
    qb = qb.in("event_type", params.eventTypes);
  }

  const { data, error } = await qb;
  if (error) {
    console.error("[embeddings:search:loadByIds]", error.message);
    return [];
  }
  return (data ?? []) as EventRow[];
}

function filterByEntityType(
  rows: EventRow[],
  entityTypes?: EntityType[],
): EventRow[] {
  if (!entityTypes?.length) {
    return rows;
  }
  const set = new Set(entityTypes);
  return rows.filter((r) => {
    const t = r.tracked_entities?.type;
    return t && set.has(t as EntityType);
  });
}

export async function hybridIntelligenceSearch(
  supabase: Db,
  params: HybridSearchParams,
): Promise<HybridSearchResult> {
  const queryEcho = sanitizeQuery(params.query);
  const limit = params.limit ?? 25;
  const offset = params.offset ?? 0;

  if (!queryEcho) {
    return { hits: [], total: 0, mode: "keyword", queryEcho: "" };
  }

  let entityIds = params.entityIds;
  if (params.entityTypes?.length && !entityIds?.length) {
    const { data } = await supabase
      .from("tracked_entities")
      .select("id")
      .eq("organization_id", params.organizationId)
      .eq("is_active", true)
      .in("type", params.entityTypes);
    entityIds = data?.map((r) => r.id) ?? [];
    if (entityIds.length === 0) {
      return { hits: [], total: 0, mode: "keyword", queryEcho };
    }
  }

  const searchParams = { ...params, entityIds };

  const [queryVector, keywordRes] = await Promise.all([
    embedQuery(queryEcho),
    keywordSearchEvents(supabase, searchParams),
  ]);

  let semanticMap = new Map<string, number>();
  let mode: HybridSearchResult["mode"] = "keyword";

  if (queryVector) {
    semanticMap = await fetchSemanticMatches(
      supabase,
      params.organizationId,
      queryVector,
    );
    if (semanticMap.size > 0) {
      mode = keywordRes.rows.length > 0 ? "hybrid" : "semantic";
    }
  }

  const eventIdSet = new Set<string>([
    ...keywordRes.rows.map((r) => r.id),
    ...semanticMap.keys(),
  ]);

  let rows = keywordRes.rows;
  const missingIds = [...eventIdSet].filter(
    (id) => !rows.some((r) => r.id === id),
  );
  if (missingIds.length > 0) {
    const extra = await loadEventsByIds(
      supabase,
      params.organizationId,
      missingIds,
      searchParams,
    );
    rows = [...rows, ...extra];
  }

  rows = filterByEntityType(rows, params.entityTypes);

  const ranked: RankedSearchHit[] = rows.map((row) => {
    const semanticSimilarity = semanticMap.get(row.id) ?? 0;
    const keywordRank = keywordRes.ranks.get(row.id) ?? 0;
    const hasSemantic = semanticSimilarity > 0;
    const hasKeyword = keywordRank > 0;

    const { finalScore, explain } = computeCompositeScore({
      semanticSimilarity,
      keywordRank,
      signalScore: row.signal_score,
      detectedAt: row.detected_at,
      sourceType: row.source_type,
      entityImportance: row.tracked_entities?.is_active ? 0.65 : 0.4,
      hasSemantic,
      hasKeyword,
    });

    const matchKinds: RankedSearchHit["matchKinds"] = [];
    if (hasSemantic) {
      matchKinds.push("semantic");
    }
    if (hasKeyword) {
      matchKinds.push("keyword");
    }

    return {
      eventId: row.id,
      entityId: row.entity_id,
      title: row.title,
      summary: row.summary,
      implication: row.implication,
      signalScore: row.signal_score,
      eventType: row.event_type,
      detectedAt: row.detected_at,
      sourceType: row.source_type,
      entityName: row.tracked_entities?.name ?? "Unknown entity",
      entityType: row.tracked_entities?.type ?? "competitor",
      finalScore,
      explain,
      matchKinds,
    };
  });

  const deduped = dedupeSearchHits(
    ranked.sort((a, b) => b.finalScore - a.finalScore),
    limit + offset + 50,
  );

  const total = deduped.length;
  const page = deduped.slice(offset, offset + limit);

  console.log("[embeddings:search]", {
    organizationId: params.organizationId,
    mode,
    queryLength: queryEcho.length,
    candidates: ranked.length,
    returned: page.length,
  });

  return { hits: page, total, mode, queryEcho };
}

export async function searchTrackedEntities(
  supabase: Db,
  organizationId: string,
  query: string,
  limit = 12,
): Promise<
  {
    id: string;
    name: string;
    type: string;
    domain: string | null;
    score: number;
  }[]
> {
  const q = sanitizeQuery(query);
  if (!q) {
    return [];
  }

  const tsQuery = q
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map((w) => w.replace(/[^\w-]/g, ""))
    .filter(Boolean)
    .join(" & ");

  let qb = supabase
    .from("tracked_entities")
    .select("id, name, type, domain, is_active")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .limit(limit);

  if (tsQuery) {
    qb = qb.textSearch("search_document", tsQuery, {
      type: "websearch",
      config: "english",
    });
  } else {
    qb = qb.ilike("name", `%${q.slice(0, 80)}%`);
  }

  const { data, error } = await qb.order("name", { ascending: true });
  if (error) {
    console.error("[embeddings:search:entities]", error.message);
    return [];
  }

  return (data ?? []).map((row, index) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    domain: row.domain,
    score: 1 - index / Math.max((data ?? []).length, 1),
  }));
}
