import { completeJson } from "@/lib/ai/claude";
import { parseJsonFromLlm } from "@/lib/ai/parse";
import { buildFallbackImplication } from "@/lib/ai/fallback";
import { GENERATE_IMPLICATION_PROMPT } from "@/lib/ai/prompts/implication";
import {
  ImplicationResultSchema,
  type ImplicationResult,
} from "@/lib/ai/schemas/event.schema";
import { AI_MODEL_IMPLICATION, type PipelineOutcome } from "@/lib/ai/types";

export type GenerateImplicationInput = {
  entityName: string;
  entityType: string;
  eventType: string;
  title: string;
  summary: string;
  diffSummary: string;
  orgProduct?: string;
  orgMarket?: string;
  orgStage?: string;
};

export type GenerateImplicationResult = {
  data: ImplicationResult;
  outcome: PipelineOutcome;
  model?: string;
};

export async function generateImplication(
  input: GenerateImplicationInput,
): Promise<GenerateImplicationResult> {
  const fallback = {
    implication: buildFallbackImplication(input.diffSummary),
  };

  const prompt = GENERATE_IMPLICATION_PROMPT({
    entityName: input.entityName,
    entityType: input.entityType,
    eventType: input.eventType,
    title: input.title,
    summary: input.summary,
    orgProduct: input.orgProduct,
    orgMarket: input.orgMarket,
    orgStage: input.orgStage,
  });

  const response = await completeJson({
    model: AI_MODEL_IMPLICATION,
    maxTokens: 400,
    prompt,
    pipeline: "ai:implication",
  });

  if (!response.ok) {
    return {
      data: fallback,
      outcome: response.error === "ai_not_configured" ? "skipped" : "api_error",
    };
  }

  try {
    const raw = parseJsonFromLlm(response.text);
    const parsed = ImplicationResultSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("[ai:implication]", {
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
    console.error("[ai:implication]", { outcome: "parse_failure" });
    return { data: fallback, outcome: "parse_failure" };
  }
}
