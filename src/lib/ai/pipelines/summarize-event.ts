import { completeJson } from "@/lib/ai/claude";
import { parseJsonFromLlm, sanitizePromptInput } from "@/lib/ai/parse";
import { buildFallbackSummary } from "@/lib/ai/fallback";
import { SUMMARIZE_EVENT_PROMPT } from "@/lib/ai/prompts/summarize";
import {
  SummarizedEventSchema,
  type SummarizedEvent,
} from "@/lib/ai/schemas/event.schema";
import { AI_MODEL_SUMMARIZE, type PipelineOutcome } from "@/lib/ai/types";
import type { IntelligenceEventType } from "@/lib/ai/schemas/event.schema";
import type { IngestionSourceType } from "@/lib/ingestion/types";

export type SummarizeEventInput = {
  entityName: string;
  entityType: string;
  eventType: IntelligenceEventType;
  sourceType: IngestionSourceType;
  sourceUrl: string;
  diffSummary: string;
  contentExcerpt: string;
};

export type SummarizeEventResult = {
  data: SummarizedEvent;
  outcome: PipelineOutcome;
  model?: string;
};

export async function summarizeEvent(
  input: SummarizeEventInput,
): Promise<SummarizeEventResult> {
  const fallback = buildFallbackSummary({
    entityName: input.entityName,
    eventType: input.eventType,
    sourceType: input.sourceType,
    diffSummary: input.diffSummary,
  });

  const prompt = SUMMARIZE_EVENT_PROMPT({
    entityName: input.entityName,
    entityType: input.entityType,
    eventType: input.eventType,
    sourceUrl: input.sourceUrl,
    diffSummary: sanitizePromptInput(input.diffSummary, 2_000),
    contentExcerpt: sanitizePromptInput(input.contentExcerpt, 4_000),
  });

  const response = await completeJson({
    model: AI_MODEL_SUMMARIZE,
    maxTokens: 700,
    prompt,
    pipeline: "ai:summarize",
  });

  if (!response.ok) {
    return {
      data: fallback,
      outcome: response.error === "ai_not_configured" ? "skipped" : "api_error",
    };
  }

  try {
    const raw = parseJsonFromLlm(response.text);
    const parsed = SummarizedEventSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("[ai:summarize]", {
        outcome: "parse_failure",
        issues: parsed.error.issues.slice(0, 3),
      });
      return { data: fallback, outcome: "parse_failure" };
    }
    return {
      data: parsed.data,
      outcome: "success",
      model: response.model,
    };
  } catch {
    console.error("[ai:summarize]", { outcome: "parse_failure" });
    return { data: fallback, outcome: "parse_failure" };
  }
}
