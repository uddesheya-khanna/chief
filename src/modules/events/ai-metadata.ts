import {
  AiEventMetadataSchema,
  type AiEventMetadata,
} from "@/lib/ai/schemas/event.schema";
import type { Json } from "@/types/database";

export type ParsedEventAiMetadata = AiEventMetadata & {
  ingestionJobId?: string;
  changeRatio?: number;
  sourceType?: string;
};

export function parseEventAiMetadata(
  metadata: Json,
): ParsedEventAiMetadata | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const aiRaw = record.ai;
  if (!aiRaw) {
    return null;
  }

  const parsed = AiEventMetadataSchema.safeParse(aiRaw);
  if (!parsed.success) {
    return null;
  }

  return {
    ...parsed.data,
    ingestionJobId:
      typeof record.ingestion_job_id === "string"
        ? record.ingestion_job_id
        : undefined,
    changeRatio:
      typeof record.change_ratio === "number" ? record.change_ratio : undefined,
    sourceType:
      typeof record.source_type === "string" ? record.source_type : undefined,
  };
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function pipelineOutcomeLabel(
  outcome: AiEventMetadata["pipeline"]["outcomes"]["classify"],
): string {
  switch (outcome) {
    case "success":
      return "OK";
    case "parse_failure":
      return "Parse fallback";
    case "api_error":
      return "API fallback";
    case "skipped":
      return "Rules only";
    default:
      return outcome;
  }
}
