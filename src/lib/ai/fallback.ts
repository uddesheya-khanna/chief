import {
  buildEventTitle,
  inferEventTypeFromDiff,
} from "@/lib/ingestion/classify";
import type { DiffResult } from "@/lib/ingestion/types";
import type { ClassifiedEvent } from "@/lib/ai/schemas/event.schema";
import type { IngestionSourceType } from "@/lib/ingestion/types";

export type RuleClassificationInput = {
  entityName: string;
  entityType: string;
  sourceType: IngestionSourceType;
  diff: DiffResult;
};

export function buildFallbackClassification(
  input: RuleClassificationInput,
): ClassifiedEvent {
  const eventType = inferEventTypeFromDiff(input.diff, input.sourceType);
  const significant =
    input.diff.hasMeaningfulChange &&
    (input.diff.changeRatio > 0.08 || eventType !== "other");

  return {
    event_type: eventType,
    is_significant: significant,
    confidence: significant ? 0.45 : 0.25,
    reasoning: "Rule-based classification from crawl diff keywords.",
  };
}

export function buildFallbackSummary(params: {
  entityName: string;
  eventType: ClassifiedEvent["event_type"];
  sourceType: IngestionSourceType;
  diffSummary: string;
}): { title: string; summary: string; key_facts: string[] } {
  return {
    title: buildEventTitle(
      params.entityName,
      params.eventType,
      params.sourceType,
    ),
    summary: params.diffSummary,
    key_facts: [],
  };
}

export function buildFallbackImplication(diffSummary: string): string {
  return `Detected change from automated monitoring. ${diffSummary} Validate against the primary source before acting.`;
}
