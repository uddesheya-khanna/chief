import { completeJson, isAiConfigured } from "@/lib/ai/claude";
import { parseJsonFromLlm, sanitizePromptInput } from "@/lib/ai/parse";
import { EXECUTIVE_DIGEST_PROMPT } from "@/lib/ai/prompts/digest";
import {
  ExecutiveDigestSchema,
  FALLBACK_DIGEST,
  type ExecutiveDigest,
} from "@/lib/ai/schemas/digest.schema";
import { AI_MODEL_SUMMARIZE } from "@/lib/ai/types";
import type { EventSummarySlice } from "@/lib/intelligence/aggregate";

export async function generateExecutiveDigest(input: {
  digestType: string;
  periodLabel: string;
  workspaceName: string;
  signals: EventSummarySlice[];
}): Promise<ExecutiveDigest> {
  if (!isAiConfigured() || input.signals.length === 0) {
    return buildFallbackDigest(input.signals);
  }

  const prompt = EXECUTIVE_DIGEST_PROMPT({
    digestType: input.digestType,
    periodLabel: sanitizePromptInput(input.periodLabel, 200),
    workspaceName: sanitizePromptInput(input.workspaceName, 120),
    signals: input.signals,
  });

  const response = await completeJson({
    model: AI_MODEL_SUMMARIZE,
    maxTokens: 1200,
    prompt,
    pipeline: "generateDigest",
  });

  if (!response.ok) {
    return buildFallbackDigest(input.signals);
  }

  try {
    const raw = parseJsonFromLlm(response.text);
    const parsed = ExecutiveDigestSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("[generateDigest] parse failure:", parsed.error.issues);
      return buildFallbackDigest(input.signals);
    }
    return parsed.data;
  } catch {
    return buildFallbackDigest(input.signals);
  }
}

function buildFallbackDigest(signals: EventSummarySlice[]): ExecutiveDigest {
  if (signals.length === 0) {
    return FALLBACK_DIGEST;
  }

  const top = signals.slice(0, 3);
  return {
    executive_summary: `Period includes ${signals.length} tracked signal(s). Top development: ${top[0]?.title ?? "—"}.`,
    key_movements: top.map((s) => ({
      heading: s.title.slice(0, 120),
      body: s.summary.slice(0, 400),
    })),
    recommended_actions: [
      "Review linked signals in the feed for full source context.",
    ],
    confidence: 0.4,
  };
}
