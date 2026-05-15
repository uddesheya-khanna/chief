import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { EntityListQuery } from "@/modules/entities/schemas";
import type { Database, Json } from "@/types/database";

import type { EntityType } from "./constants";

export type TrackedEntityRow =
  Database["public"]["Tables"]["tracked_entities"]["Row"];

const TRACKED_ENTITY_COLUMNS =
  "id, organization_id, type, name, domain, description, metadata, is_active, created_by, created_at, updated_at";

function sanitizeSearch(q: string): string {
  return q.replace(/[%_\\]/g, "").trim();
}

export async function listTrackedEntities(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  query: EntityListQuery,
): Promise<TrackedEntityRow[]> {
  let qb = supabase
    .from("tracked_entities")
    .select(TRACKED_ENTITY_COLUMNS)
    .eq("organization_id", organizationId);

  if (query.type) {
    qb = qb.eq("type", query.type as EntityType);
  }

  if (query.status === "active") {
    qb = qb.eq("is_active", true);
  } else if (query.status === "archived") {
    qb = qb.eq("is_active", false);
  }

  const q = query.q ? sanitizeSearch(query.q) : "";
  if (q.length > 0) {
    qb = qb.ilike("name", `%${q}%`);
  }

  const { data, error } = await qb
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("listTrackedEntities", error);
    return [];
  }
  return data ?? [];
}

async function getTrackedEntityImpl(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  entityId: string,
): Promise<TrackedEntityRow | null> {
  const { data, error } = await supabase
    .from("tracked_entities")
    .select(TRACKED_ENTITY_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", entityId)
    .maybeSingle();

  if (error) {
    console.error("getTrackedEntity", error);
    return null;
  }
  return data;
}

/** Deduped per request (shared by entity layout and tab pages). */
export const getTrackedEntity = cache(getTrackedEntityImpl);

export function normalizeMetadata(raw: Json): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}
