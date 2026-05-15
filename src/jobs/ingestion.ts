/**
 * Ingestion job orchestration — invoked by Server Actions, API cron, or Trigger.dev.
 * Keep functions discrete; no workflow engine in this phase.
 */

import { buildEntitySourceUrl } from "@/lib/ingestion/crawl";
import {
  createQueuedIngestionJob,
  runIngestionJob,
  type RunIngestionResult,
} from "@/lib/ingestion/pipeline";
import type { IngestionSourceType } from "@/lib/ingestion/types";
import { finalizeIngestionWithIntelligence } from "@/jobs/intelligence";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const ENTITY_COLUMNS =
  "id, organization_id, name, domain, type, is_active";

export type ScheduleEntityIngestionInput = {
  organizationId: string;
  entityId: string;
  entityName: string;
  entityType: string;
  domain: string | null;
  sourceType: IngestionSourceType;
};

export async function scheduleEntityIngestion(
  input: ScheduleEntityIngestionInput,
): Promise<{ jobId: string } | { error: string }> {
  const sourceUrl = buildEntitySourceUrl(input.domain, input.sourceType);
  if (!sourceUrl) {
    return { error: "Entity has no domain configured for crawling." };
  }

  const created = await createQueuedIngestionJob({
    organizationId: input.organizationId,
    entityId: input.entityId,
    sourceType: input.sourceType,
    sourceUrl,
  });

  if ("error" in created) {
    return created;
  }

  return { jobId: created.jobId };
}

export async function executeIngestionJob(
  organizationId: string,
  jobId: string,
  target: ScheduleEntityIngestionInput,
): Promise<RunIngestionResult> {
  const sourceUrl = buildEntitySourceUrl(target.domain, target.sourceType);
  if (!sourceUrl) {
    return {
      jobId,
      status: "failed",
      resultType: "error",
      errorMessage: "Missing domain",
    };
  }

  const crawlResult = await runIngestionJob(jobId, {
    organizationId,
    entityId: target.entityId,
    entityName: target.entityName,
    entityType: target.entityType,
    sourceType: target.sourceType,
    sourceUrl,
  });

  return finalizeIngestionWithIntelligence(
    {
      organizationId,
      entityId: target.entityId,
      entityName: target.entityName,
      entityType: target.entityType,
      sourceType: target.sourceType,
      sourceUrl,
    },
    crawlResult,
  );
}

export async function runEntityIngestionNow(
  input: ScheduleEntityIngestionInput,
): Promise<RunIngestionResult & { error?: string }> {
  const scheduled = await scheduleEntityIngestion(input);
  if ("error" in scheduled) {
    return {
      jobId: "",
      status: "failed",
      resultType: "error",
      error: scheduled.error,
      errorMessage: scheduled.error,
    };
  }

  const result = await executeIngestionJob(
    input.organizationId,
    scheduled.jobId,
    input,
  );

  return result;
}

export type CronIngestionSummary = {
  processed: number;
  newEvents: number;
  noChange: number;
  failed: number;
  skipped: number;
};

const MAX_ENTITIES_PER_CRON = 10;

/**
 * Process active entities with domains — conservative batch for cron/Trigger.dev.
 */
export async function runDueIngestionBatch(
  organizationId: string,
): Promise<CronIngestionSummary> {
  const supabase = createSupabaseServiceClient();

  const { data: entities, error } = await supabase
    .from("tracked_entities")
    .select(ENTITY_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .not("domain", "is", null)
    .order("updated_at", { ascending: true })
    .limit(MAX_ENTITIES_PER_CRON);

  if (error) {
    console.error("[ingestion:cron:entities]", error.message);
    return { processed: 0, newEvents: 0, noChange: 0, failed: 0, skipped: 0 };
  }

  const summary: CronIngestionSummary = {
    processed: 0,
    newEvents: 0,
    noChange: 0,
    failed: 0,
    skipped: 0,
  };

  for (const entity of entities ?? []) {
    if (!entity.domain?.trim()) {
      continue;
    }

    const input: ScheduleEntityIngestionInput = {
      organizationId,
      entityId: entity.id,
      entityName: entity.name,
      entityType: entity.type,
      domain: entity.domain,
      sourceType: "website",
    };

    const result = await runEntityIngestionNow(input);
    summary.processed += 1;

    if (result.resultType === "new_content") {
      summary.newEvents += 1;
    } else if (result.resultType === "no_change") {
      summary.noChange += 1;
    } else if (result.status === "skipped") {
      summary.skipped += 1;
    } else if (result.status === "failed") {
      summary.failed += 1;
    }
  }

  console.log("[ingestion:cron]", { organizationId, ...summary });
  return summary;
}
