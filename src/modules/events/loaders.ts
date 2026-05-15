import type { SupabaseClient } from "@supabase/supabase-js";

import type { EntityType } from "@/modules/entities/constants";
import type { WorkspaceFeedQuery } from "@/modules/feed/search-params";
import { WORKSPACE_FEED_PAGE_SIZE } from "@/modules/feed/search-params";
import type { EventType } from "@/modules/events/constants";
import type { Database } from "@/types/database";

const EVENT_LIST_COLUMNS =
  "id, organization_id, entity_id, source_url, source_type, event_type, title, summary, implication, raw_content, signal_score, metadata, is_dismissed, dismissed_at, dismissed_by, detected_at, published_at, created_at";

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
  options?: { entityId?: string },
): Promise<IntelligenceEventRow | null> {
  let qb = supabase
    .from("intelligence_events")
    .select(EVENT_LIST_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", eventId);

  if (options?.entityId) {
    qb = qb.eq("entity_id", options.entityId);
  }

  const { data, error } = await qb.maybeSingle();

  if (error) {
    console.error("[events:get]", error.message);
    return null;
  }
  return data;
}

const FEED_ENTITY_EMBED = "tracked_entities ( id, name, type )";

const FEED_EVENT_SELECT = `${EVENT_LIST_COLUMNS}, ${FEED_ENTITY_EMBED}`;

export type FeedEventWithEntity = IntelligenceEventRow & {
  tracked_entities: { id: string; name: string; type: string } | null;
};

async function resolveEntityIdsForFeedTypes(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  types: EntityType[],
): Promise<string[] | null> {
  if (types.length === 0) {
    return null;
  }
  const { data, error } = await supabase
    .from("tracked_entities")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .in("type", types);

  if (error) {
    console.error("[events:feed:entityIds]", error.message);
    return [];
  }
  return data?.map((r) => r.id) ?? [];
}

function applySignalLevelFilters<Q extends { or: (s: string) => Q; gte: (c: string, v: number) => Q; lt: (c: string, v: number) => Q }>(
  qb: Q,
  levels: ("high" | "medium" | "low")[],
): Q {
  const set = new Set(levels);
  if (set.size === 0 || set.size === 3) {
    return qb;
  }
  if (set.size === 1) {
    if (set.has("high")) {
      return qb.gte("signal_score", 80);
    }
    if (set.has("medium")) {
      return qb.gte("signal_score", 50).lt("signal_score", 80);
    }
    return qb.lt("signal_score", 50);
  }
  if (set.has("high") && set.has("medium") && !set.has("low")) {
    return qb.gte("signal_score", 50);
  }
  if (set.has("medium") && set.has("low") && !set.has("high")) {
    return qb.lt("signal_score", 80);
  }
  if (set.has("high") && set.has("low") && !set.has("medium")) {
    return qb.or("signal_score.gte.80,signal_score.lt.50");
  }
  return qb;
}

export type WorkspaceFeedQueryResult = {
  events: FeedEventWithEntity[];
  total: number;
  error?: string;
};

export async function queryWorkspaceIntelligenceFeed(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  feed: WorkspaceFeedQuery,
): Promise<WorkspaceFeedQueryResult> {
  const entityIds = await resolveEntityIdsForFeedTypes(
    supabase,
    organizationId,
    feed.entityTypes,
  );
  if (entityIds && entityIds.length === 0) {
    return { events: [], total: 0 };
  }

  const pageSize = WORKSPACE_FEED_PAGE_SIZE;
  const from = (feed.page - 1) * pageSize;
  const to = from + pageSize - 1;

  const buildList = () => {
    let qb = supabase
      .from("intelligence_events")
      .select(FEED_EVENT_SELECT)
      .eq("organization_id", organizationId);

    if (!feed.includeDismissed) {
      qb = qb.eq("is_dismissed", false);
    }
    if (entityIds) {
      qb = qb.in("entity_id", entityIds);
    }
    if (feed.eventTypes.length > 0) {
      qb = qb.in("event_type", feed.eventTypes as EventType[]);
    }
    qb = applySignalLevelFilters(qb, feed.signalLevels);
    if (feed.dateFrom) {
      qb = qb.gte("detected_at", `${feed.dateFrom}T00:00:00.000Z`);
    }
    if (feed.dateTo) {
      qb = qb.lte("detected_at", `${feed.dateTo}T23:59:59.999Z`);
    }
    return qb.order("detected_at", { ascending: false }).range(from, to);
  };

  const buildCount = () => {
    let qb = supabase
      .from("intelligence_events")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    if (!feed.includeDismissed) {
      qb = qb.eq("is_dismissed", false);
    }
    if (entityIds) {
      qb = qb.in("entity_id", entityIds);
    }
    if (feed.eventTypes.length > 0) {
      qb = qb.in("event_type", feed.eventTypes as EventType[]);
    }
    qb = applySignalLevelFilters(qb, feed.signalLevels);
    if (feed.dateFrom) {
      qb = qb.gte("detected_at", `${feed.dateFrom}T00:00:00.000Z`);
    }
    if (feed.dateTo) {
      qb = qb.lte("detected_at", `${feed.dateTo}T23:59:59.999Z`);
    }
    return qb;
  };

  const [listRes, countRes] = await Promise.all([buildList(), buildCount()]);

  if (listRes.error) {
    console.error("[events:feed:list]", listRes.error.message);
    return {
      events: [],
      total: 0,
      error: "Failed to load intelligence feed.",
    };
  }
  if (countRes.error) {
    console.error("[events:feed:count]", countRes.error.message);
  }

  return {
    events: (listRes.data ?? []) as FeedEventWithEntity[],
    total: countRes.count ?? 0,
    ...(countRes.error ? { error: "Partial load: total count unavailable." } : {}),
  };
}

export async function listRecentWorkspaceFeedEvents(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  limit: number,
): Promise<FeedEventWithEntity[]> {
  const { data, error } = await supabase
    .from("intelligence_events")
    .select(FEED_EVENT_SELECT)
    .eq("organization_id", organizationId)
    .eq("is_dismissed", false)
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[events:feed:recent]", error.message);
    return [];
  }
  return (data ?? []) as FeedEventWithEntity[];
}

export async function countIntelligenceEventsAfter(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  afterIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("intelligence_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_dismissed", false)
    .gt("detected_at", afterIso);

  if (error) {
    console.error("[events:feed:countAfter]", error.message);
    return 0;
  }
  return count ?? 0;
}

export type WorkspaceIntelligenceMetrics = {
  activeEntityCount: number;
  openSignalCount: number;
  signalsLast7Days: number;
  topSignalScore7d: number | null;
};

export async function getWorkspaceIntelligenceMetrics(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<WorkspaceIntelligenceMetrics> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    entitiesRes,
    openSignalsRes,
    weekRes,
    topRes,
  ] = await Promise.all([
    supabase
      .from("tracked_entities")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("intelligence_events")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_dismissed", false),
    supabase
      .from("intelligence_events")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_dismissed", false)
      .gte("detected_at", weekAgo),
    supabase
      .from("intelligence_events")
      .select("signal_score")
      .eq("organization_id", organizationId)
      .eq("is_dismissed", false)
      .gte("detected_at", weekAgo)
      .order("signal_score", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (entitiesRes.error) {
    console.error("[events:metrics:entities]", entitiesRes.error.message);
  }
  if (openSignalsRes.error) {
    console.error("[events:metrics:open]", openSignalsRes.error.message);
  }
  if (weekRes.error) {
    console.error("[events:metrics:week]", weekRes.error.message);
  }
  if (topRes.error) {
    console.error("[events:metrics:top]", topRes.error.message);
  }

  return {
    activeEntityCount: entitiesRes.count ?? 0,
    openSignalCount: openSignalsRes.count ?? 0,
    signalsLast7Days: weekRes.count ?? 0,
    topSignalScore7d:
      topRes.data && typeof topRes.data.signal_score === "number"
        ? topRes.data.signal_score
        : null,
  };
}
