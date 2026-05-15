import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const DIGEST_COLUMNS =
  "id, organization_id, digest_type, title, period_start, period_end, content, entity_id, status, generated_by, created_at";

export type IntelligenceDigestRow =
  Database["public"]["Tables"]["intelligence_digests"]["Row"];

export async function listDigests(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  limit = 20,
): Promise<IntelligenceDigestRow[]> {
  const { data, error } = await supabase
    .from("intelligence_digests")
    .select(DIGEST_COLUMNS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[digests:list]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getDigest(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  digestId: string,
): Promise<IntelligenceDigestRow | null> {
  const { data, error } = await supabase
    .from("intelligence_digests")
    .select(DIGEST_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", digestId)
    .maybeSingle();

  if (error) {
    console.error("[digests:get]", error.message);
    return null;
  }
  return data;
}

export async function getLatestDigestByType(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  digestType: string,
): Promise<IntelligenceDigestRow | null> {
  const { data, error } = await supabase
    .from("intelligence_digests")
    .select(DIGEST_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("digest_type", digestType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[digests:latest]", error.message);
    return null;
  }
  return data;
}
