import { computeDiff } from "@/lib/ingestion/diff";
import { crawlPage } from "@/lib/ingestion/crawl";
import { hasRecentDuplicateUrl } from "@/lib/ingestion/dedup";
import { getLatestSnapshot, storeSnapshot } from "@/lib/ingestion/snapshot";
import type {
  EntityIngestionTarget,
  IngestionResultType,
  IngestionSourceType,
} from "@/lib/ingestion/types";
import type { DiffResult } from "@/lib/ingestion/types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const JOB_COLUMNS =
  "id, organization_id, entity_id, rule_id, source_type, source_url, status, result_type, raw_content, snapshot_path, previous_snapshot_path, diff_summary, error_message, started_at, completed_at, created_at";

export type IngestionEnrichmentPayload = {
  diff: DiffResult;
  rawContent: string;
  fetchedAt: Date;
  snapshotPath: string;
  previousSnapshotPath: string | null;
};

export type RunIngestionResult = {
  jobId: string;
  status: "completed" | "failed" | "skipped";
  resultType: IngestionResultType | null;
  eventId?: string;
  errorMessage?: string;
  /** Caller (jobs/) runs AI enrichment when set. */
  enrichment?: IngestionEnrichmentPayload;
};

export async function runIngestionJob(
  jobId: string,
  target: EntityIngestionTarget,
): Promise<RunIngestionResult> {
  const supabase = createSupabaseServiceClient();
  const startedAt = new Date().toISOString();

  await supabase
    .from("ingestion_jobs")
    .update({
      status: "running",
      started_at: startedAt,
    })
    .eq("id", jobId)
    .eq("organization_id", target.organizationId);

  const crawl = await crawlPage(target.sourceUrl);

  if (!crawl.success || !crawl.content.trim()) {
    const errorMessage = crawl.error ?? "Crawl failed with no content";
    await supabase
      .from("ingestion_jobs")
      .update({
        status: "failed",
        result_type: "error",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.error("[ingestion:run]", {
      jobId,
      entityId: target.entityId,
      error: errorMessage,
    });

    return {
      jobId,
      status: "failed",
      resultType: "error",
      errorMessage,
    };
  }

  const previous = await getLatestSnapshot({
    organizationId: target.organizationId,
    entityId: target.entityId,
    sourceType: target.sourceType,
  });

  const stored = await storeSnapshot({
    organizationId: target.organizationId,
    entityId: target.entityId,
    sourceType: target.sourceType,
    content: crawl.content,
    date: crawl.fetchedAt,
  });

  if (stored.error) {
    await supabase
      .from("ingestion_jobs")
      .update({
        status: "failed",
        result_type: "error",
        error_message: stored.error,
        raw_content: crawl.content.slice(0, 50_000),
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return {
      jobId,
      status: "failed",
      resultType: "error",
      errorMessage: stored.error,
    };
  }

  const diff = computeDiff(previous?.content ?? "", crawl.content);

  if (!diff.hasMeaningfulChange) {
    await supabase
      .from("ingestion_jobs")
      .update({
        status: "completed",
        result_type: "no_change",
        raw_content: crawl.content.slice(0, 50_000),
        snapshot_path: stored.path,
        previous_snapshot_path: previous?.path ?? null,
        diff_summary: diff.summary,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log("[ingestion:run]", {
      jobId,
      entityId: target.entityId,
      result: "no_change",
    });

    return { jobId, status: "completed", resultType: "no_change" };
  }

  const duplicate = await hasRecentDuplicateUrl(
    target.organizationId,
    target.entityId,
    target.sourceUrl,
  );

  if (duplicate) {
    await supabase
      .from("ingestion_jobs")
      .update({
        status: "skipped",
        result_type: "skipped_duplicate",
        raw_content: crawl.content.slice(0, 50_000),
        snapshot_path: stored.path,
        previous_snapshot_path: previous?.path ?? null,
        diff_summary: diff.summary,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return { jobId, status: "skipped", resultType: "skipped_duplicate" };
  }

  return {
    jobId,
    status: "completed",
    resultType: null,
    enrichment: {
      diff,
      rawContent: crawl.content,
      fetchedAt: crawl.fetchedAt,
      snapshotPath: stored.path,
      previousSnapshotPath: previous?.path ?? null,
    },
  };
}

export async function createQueuedIngestionJob(params: {
  organizationId: string;
  entityId: string;
  sourceType: IngestionSourceType;
  sourceUrl: string;
}): Promise<{ jobId: string } | { error: string }> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("ingestion_jobs")
    .insert({
      organization_id: params.organizationId,
      entity_id: params.entityId,
      source_type: params.sourceType,
      source_url: params.sourceUrl,
      status: "queued",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create ingestion job" };
  }

  return { jobId: data.id };
}

export async function getIngestionJob(
  organizationId: string,
  jobId: string,
) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ingestion_jobs")
    .select(JOB_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    console.error("[ingestion:getJob]", error.message);
    return null;
  }
  return data;
}
