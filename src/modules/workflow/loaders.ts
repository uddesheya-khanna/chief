import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export async function listUserCollections(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  userId: string,
): Promise<Database["public"]["Tables"]["workflow_collections"]["Row"][]> {
  const { data, error } = await supabase
    .from("workflow_collections")
    .select(
      "id, organization_id, user_id, name, collection_type, description, is_shared, created_at, updated_at",
    )
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[workflow:collections]", error.message);
    return [];
  }
  return data ?? [];
}

export async function listBookmarkedEventIds(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  userId: string,
): Promise<Set<string>> {
  const { data: collections } = await supabase
    .from("workflow_collections")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("collection_type", "bookmarks");

  const ids = collections?.map((c) => c.id) ?? [];
  if (ids.length === 0) {
    return new Set();
  }

  const { data: items } = await supabase
    .from("workflow_collection_items")
    .select("item_id")
    .eq("organization_id", organizationId)
    .in("collection_id", ids)
    .eq("item_type", "event");

  return new Set((items ?? []).map((i) => i.item_id));
}

export async function listPinnedEntityIds(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  userId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("pinned_entities")
    .select("entity_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  return new Set((data ?? []).map((r) => r.entity_id));
}
