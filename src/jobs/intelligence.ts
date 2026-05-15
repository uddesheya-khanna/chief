/**
 * Cross-domain orchestration: ingestion diff → AI enrichment → intelligence_events.
 * Per conventions.md, jobs/ may import lib/ai and lib/ingestion.
 */

import { enrichIntelligenceFromDiff } from "@/lib/ai/pipelines/enrich-from-diff";
import type { OrgIntelligenceContext } from "@/lib/ai/pipelines/enrich-from-diff";
import {
  findSimilarRecentEvent,
  hasRecentDuplicateUrl,
  shouldSuppressLowQualityEvent,
} from "@/lib/ingestion/dedup";
import type {
  EntityIngestionTarget,
  IngestionResultType,
} from "@/lib/ingestion/types";
import type { IngestionEnrichmentPayload } from "@/lib/ingestion/pipeline";
import type { RunIngestionResult } from "@/lib/ingestion/pipeline";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/database";

export type PersistIntelligenceInput = {
  target: EntityIngestionTarget;
  jobId: string;
  sourceUrl: string;
  enrichment: IngestionEnrichmentPayload;
};

export type PersistIntelligenceResult =
  | { ok: true; eventId: string }
  | { ok: false; reason: "duplicate_url" | "duplicate_similar" | "suppressed" | "insert_failed"; message?: string };

async function loadOrgContext(
  organizationId: string,
): Promise<OrgIntelligenceContext | undefined> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data?.settings || typeof data.settings !== "object") {
    return undefined;
  }

  const settings = data.settings as Record<string, unknown>;
  const intelligence =
    settings.intelligence && typeof settings.intelligence === "object"
      ? (settings.intelligence as Record<string, unknown>)
      : settings;

  return {
    productDescription:
      typeof intelligence.product_description === "string"
        ? intelligence.product_description
        : typeof intelligence.productDescription === "string"
          ? intelligence.productDescription
          : undefined,
    market:
      typeof intelligence.market === "string" ? intelligence.market : undefined,
    stage:
      typeof intelligence.stage === "string" ? intelligence.stage : undefined,
  };
}

export async function persistIntelligenceFromIngestion(
  input: PersistIntelligenceInput,
): Promise<PersistIntelligenceResult> {
  const { target, jobId, sourceUrl, enrichment } = input;
  const { diff, rawContent, fetchedAt } = enrichment;

  const duplicateUrl = await hasRecentDuplicateUrl(
    target.organizationId,
    target.entityId,
    sourceUrl,
  );
  if (duplicateUrl) {
    return { ok: false, reason: "duplicate_url" };
  }

  const orgContext = await loadOrgContext(target.organizationId);

  const enriched = await enrichIntelligenceFromDiff({
    entityName: target.entityName,
    entityType: target.entityType,
    sourceType: target.sourceType,
    sourceUrl,
    diff,
    contentExcerpt: rawContent,
    orgContext,
    detectedAt: fetchedAt,
  });

  if (
    shouldSuppressLowQualityEvent({
      isSignificant: enriched.isSignificant,
      confidence: enriched.metadata.classification.confidence,
      changeRatio: diff.changeRatio,
    }) ||
    enriched.suppress
  ) {
    console.log("[intelligence:persist]", {
      jobId,
      entityId: target.entityId,
      outcome: "suppressed",
    });
    return { ok: false, reason: "suppressed" };
  }

  const similar = await findSimilarRecentEvent({
    organizationId: target.organizationId,
    entityId: target.entityId,
    eventType: enriched.eventType,
    summary: enriched.summary,
    title: enriched.title,
  });
  if (similar) {
    return { ok: false, reason: "duplicate_similar" };
  }

  const metadata: Json = {
    ingestion_job_id: jobId,
    change_ratio: diff.changeRatio,
    source_type: target.sourceType,
    ai: enriched.metadata,
  };

  const supabase = createSupabaseServiceClient();
  const { data: event, error } = await supabase
    .from("intelligence_events")
    .insert({
      organization_id: target.organizationId,
      entity_id: target.entityId,
      source_url: sourceUrl,
      source_type: "website",
      event_type: enriched.eventType,
      title: enriched.title,
      summary: enriched.summary,
      implication: enriched.implication,
      raw_content: rawContent.slice(0, 50_000),
      signal_score: enriched.signalScore,
      metadata,
      published_at: fetchedAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !event) {
    console.error("[intelligence:persist]", {
      jobId,
      error: error?.message ?? "insert_failed",
    });
    return {
      ok: false,
      reason: "insert_failed",
      message: error?.message,
    };
  }

  console.log("[intelligence:persist]", {
    jobId,
    entityId: target.entityId,
    eventId: event.id,
    eventType: enriched.eventType,
    signalScore: enriched.signalScore,
  });

  return { ok: true, eventId: event.id };
}

export async function finalizeIngestionWithIntelligence(
  target: EntityIngestionTarget,
  crawlResult: RunIngestionResult,
): Promise<RunIngestionResult> {
  if (!crawlResult.enrichment) {
    return crawlResult;
  }

  const { enrichment, jobId } = crawlResult;
  const supabase = createSupabaseServiceClient();

  const persisted = await persistIntelligenceFromIngestion({
    target,
    jobId,
    sourceUrl: target.sourceUrl,
    enrichment,
  });

  if (!persisted.ok) {
    const resultType: IngestionResultType =
      persisted.reason === "duplicate_url" ||
      persisted.reason === "duplicate_similar"
        ? "skipped_duplicate"
        : persisted.reason === "suppressed"
          ? "no_change"
          : "error";

    const status =
      persisted.reason === "insert_failed" ? "failed" : "skipped";

    await supabase
      .from("ingestion_jobs")
      .update({
        status: status === "failed" ? "failed" : "skipped",
        result_type: resultType,
        error_message:
          persisted.reason === "insert_failed"
            ? persisted.message ?? "Failed to create intelligence event"
            : null,
        raw_content: enrichment.rawContent.slice(0, 50_000),
        snapshot_path: enrichment.snapshotPath,
        previous_snapshot_path: enrichment.previousSnapshotPath,
        diff_summary: enrichment.diff.summary,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (persisted.reason === "insert_failed") {
      return {
        jobId,
        status: "failed",
        resultType: "error",
        errorMessage: persisted.message,
      };
    }

    return { jobId, status: "skipped", resultType };
  }

  await supabase
    .from("ingestion_jobs")
    .update({
      status: "completed",
      result_type: "new_content",
      raw_content: enrichment.rawContent.slice(0, 50_000),
      snapshot_path: enrichment.snapshotPath,
      previous_snapshot_path: enrichment.previousSnapshotPath,
      diff_summary: enrichment.diff.summary,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  return {
    jobId,
    status: "completed",
    resultType: "new_content",
    eventId: persisted.eventId,
  };
}
