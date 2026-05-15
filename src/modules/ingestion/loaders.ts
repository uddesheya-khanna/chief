import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const JOB_LIST_COLUMNS =
  "id, organization_id, entity_id, source_type, source_url, status, result_type, snapshot_path, diff_summary, error_message, started_at, completed_at, created_at";

export type IngestionJobRow = Pick<
  Database["public"]["Tables"]["ingestion_jobs"]["Row"],
  | "id"
  | "organization_id"
  | "entity_id"
  | "source_type"
  | "source_url"
  | "status"
  | "result_type"
  | "snapshot_path"
  | "diff_summary"
  | "error_message"
  | "started_at"
  | "completed_at"
  | "created_at"
>;

export type EntityIngestionSummary = {
  lastJob: IngestionJobRow | null;
  lastSuccessAt: string | null;
  recentJobs: IngestionJobRow[];
};

export async function listIngestionJobsForEntity(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  entityId: string,
  limit = 20,
): Promise<IngestionJobRow[]> {
  const { data, error } = await supabase
    .from("ingestion_jobs")
    .select(JOB_LIST_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[ingestion:listForEntity]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getEntityIngestionSummary(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  entityId: string,
): Promise<EntityIngestionSummary> {
  const recentJobs = await listIngestionJobsForEntity(
    supabase,
    organizationId,
    entityId,
    15,
  );

  const lastJob = recentJobs[0] ?? null;
  const lastSuccess = recentJobs.find(
    (j) =>
      j.status === "completed" &&
      (j.result_type === "new_content" || j.result_type === "no_change"),
  );

  return {
    lastJob,
    lastSuccessAt: lastSuccess?.completed_at ?? null,
    recentJobs,
  };
}
