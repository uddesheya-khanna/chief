import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const REL_COLUMNS =
  "id, organization_id, from_entity_id, to_entity_id, relationship_type, metadata, valid_from, valid_until, created_by, created_at, updated_at";

export type EntityRelationshipRow =
  Database["public"]["Tables"]["entity_relationships"]["Row"] & {
    from_entity?: { id: string; name: string; type: string } | null;
    to_entity?: { id: string; name: string; type: string } | null;
  };

export async function listEntityRelationships(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  entityId: string,
): Promise<EntityRelationshipRow[]> {
  const { data, error } = await supabase
    .from("entity_relationships")
    .select(REL_COLUMNS)
    .eq("organization_id", organizationId)
    .or(`from_entity_id.eq.${entityId},to_entity_id.eq.${entityId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[relationships:list]", error.message);
    return [];
  }

  const rows = data ?? [];
  const entityIds = new Set<string>();
  for (const row of rows) {
    entityIds.add(row.from_entity_id);
    entityIds.add(row.to_entity_id);
  }

  const { data: entities } = await supabase
    .from("tracked_entities")
    .select("id, name, type")
    .eq("organization_id", organizationId)
    .in("id", [...entityIds]);

  const byId = new Map(
    (entities ?? []).map((e) => [e.id, e]),
  );

  return rows.map((row) => ({
    ...row,
    from_entity: byId.get(row.from_entity_id) ?? null,
    to_entity: byId.get(row.to_entity_id) ?? null,
  }));
}
