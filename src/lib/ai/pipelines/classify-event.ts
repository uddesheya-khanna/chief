import { completeJson } from "@/lib/ai/claude";
import { parseJsonFromLlm, sanitizePromptInput } from "@/lib/ai/parse";
import { CLASSIFY_EVENT_PROMPT } from "@/lib/ai/prompts/classify";
import {
  ClassifiedEventSchema,
  type ClassifiedEvent,
} from "@/lib/ai/schemas/event.schema";
import { AI_MODEL_CLASSIFY, type PipelineOutcome } from "@/lib/ai/types";
import {
  buildFallbackClassification,
  type RuleClassificationInput,
} from "@/lib/ai/fallback";

export type ClassifyEventInput = RuleClassificationInput & {
  sourceUrl: string;
  diffSummary: string;
  contentExcerpt: string;
};

export type ClassifyEventResult = {
  data: ClassifiedEvent;
  outcome: PipelineOutcome;
  model?: string;
};

export async function classifyEvent(
  input: ClassifyEventInput,
): Promise<ClassifyEventResult> {
  const fallback = buildFallbackClassification(input);

  const prompt = CLASSIFY_EVENT_PROMPT({
    entityName: input.entityName,
    entityType: input.entityType,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    diffSummary: sanitizePromptInput(input.diffSummary, 2_000),
    contentExcerpt: sanitizePromptInput(input.contentExcerpt, 3_000),
  });

  const response = await completeJson({
    model: AI_MODEL_CLASSIFY,
    maxTokens: 500,
    prompt,
    pipeline: "ai:classify",
  });

  if (!response.ok) {
    return {
      data: fallback,
      outcome: response.error === "ai_not_configured" ? "skipped" : "api_error",
    };
  }

  try {
    const raw = parseJsonFromLlm(response.text);
    const parsed = ClassifiedEventSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("[ai:classify]", {
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
    console.error("[ai:classify]", { outcome: "parse_failure" });
    return { data: fallback, outcome: "parse_failure" };
  }
}
