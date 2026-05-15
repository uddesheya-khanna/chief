import { classifyEvent } from "@/lib/ai/pipelines/classify-event";
import { generateImplication } from "@/lib/ai/pipelines/generate-implication";
import { summarizeEvent } from "@/lib/ai/pipelines/summarize-event";
import type { AiEventMetadata } from "@/lib/ai/schemas/event.schema";
import type { PipelineStepLog } from "@/lib/ai/types";
import type { DiffResult } from "@/lib/ingestion/types";
import type { IngestionSourceType } from "@/lib/ingestion/types";
import { computeSignalScore } from "@/lib/utils/signal-score";
import type { EventType } from "@/modules/events/constants";
import { isEventType } from "@/modules/events/constants";

export type OrgIntelligenceContext = {
  productDescription?: string;
  market?: string;
  stage?: string;
};

export type EnrichFromDiffInput = {
  entityName: string;
  entityType: string;
  sourceType: IngestionSourceType;
  sourceUrl: string;
  diff: DiffResult;
  contentExcerpt: string;
  orgContext?: OrgIntelligenceContext;
  detectedAt?: Date;
};

export type EnrichedIntelligence = {
  eventType: EventType;
  title: string;
  summary: string;
  implication: string;
  signalScore: number;
  isSignificant: boolean;
  metadata: AiEventMetadata;
  suppress: boolean;
};

export async function enrichIntelligenceFromDiff(
  input: EnrichFromDiffInput,
): Promise<EnrichedIntelligence> {
  const excerpt = input.contentExcerpt.slice(0, 8_000);
  const diffSummary = input.diff.summary;

  const classified = await classifyEvent({
    entityName: input.entityName,
    entityType: input.entityType,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    diff: input.diff,
    diffSummary,
    contentExcerpt: excerpt,
  });

  const classificationSource =
    classified.outcome === "success" ? ("ai" as const) : ("fallback" as const);

  if (
    !classified.data.is_significant &&
    classified.data.confidence < 0.55 &&
    classificationSource === "ai"
  ) {
    console.log("[ai:enrich]", {
      entityName: input.entityName,
      outcome: "skipped_not_significant",
      confidence: classified.data.confidence,
    });
  }

  const eventType = isEventType(classified.data.event_type)
    ? classified.data.event_type
    : "other";

  const summarized = await summarizeEvent({
    entityName: input.entityName,
    entityType: input.entityType,
    eventType,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    diffSummary,
    contentExcerpt: excerpt,
  });

  const implication = await generateImplication({
    entityName: input.entityName,
    entityType: input.entityType,
    eventType,
    title: summarized.data.title,
    summary: summarized.data.summary,
    diffSummary,
    orgProduct: input.orgContext?.productDescription,
    orgMarket: input.orgContext?.market,
    orgStage: input.orgContext?.stage,
  });

  const scoring = computeSignalScore({
    eventType,
    changeRatio: input.diff.changeRatio,
    aiConfidence: classified.data.confidence,
    isSignificant: classified.data.is_significant,
    detectedAt: input.detectedAt,
  });

  const outcomes: PipelineStepLog = {
    classify: classified.outcome,
    summarize: summarized.outcome,
    implication: implication.outcome,
  };

  const metadata: AiEventMetadata = {
    classification: {
      event_type: eventType,
      confidence: classified.data.confidence,
      reasoning: classified.data.reasoning,
      source: classificationSource,
      is_significant: classified.data.is_significant,
    },
    scoring: {
      score: scoring.score,
      severity: scoring.severity,
      factors: scoring.factors,
    },
    pipeline: {
      version: "1",
      models: {
        classify: classified.model,
        summarize: summarized.model,
        implication: implication.model,
      },
      outcomes,
    },
  };

  const suppress =
    !classified.data.is_significant &&
    classified.data.confidence < 0.5 &&
    input.diff.changeRatio < 0.05;

  console.log("[ai:enrich]", {
    entityName: input.entityName,
    eventType,
    score: scoring.score,
    significant: classified.data.is_significant,
    outcomes,
  });

  return {
    eventType,
    title: summarized.data.title,
    summary: summarized.data.summary,
    implication: implication.data.implication,
    signalScore: scoring.score,
    isSignificant: classified.data.is_significant,
    metadata,
    suppress,
  };
}
