import Anthropic from "@anthropic-ai/sdk";

import {
  AI_MODEL_CLASSIFY,
  AI_MODEL_IMPLICATION,
  AI_MODEL_SUMMARIZE,
} from "@/lib/ai/types";

export { AI_MODEL_CLASSIFY, AI_MODEL_SUMMARIZE, AI_MODEL_IMPLICATION };

export type CompleteJsonParams = {
  model: string;
  maxTokens: number;
  prompt: string;
  pipeline: string;
};

export type CompleteJsonResult =
  | { ok: true; text: string; model: string }
  | { ok: false; error: string; model: string };

let client: Anthropic | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Single completion call for pipeline use. Never throws — returns structured failure.
 */
export async function completeJson(
  params: CompleteJsonParams,
): Promise<CompleteJsonResult> {
  const anthropic = getClient();
  if (!anthropic) {
    return { ok: false, error: "ai_not_configured", model: params.model };
  }

  const inputEstimate = Math.ceil(params.prompt.length / 4);

  try {
    const response = await anthropic.messages.create({
      model: params.model,
      max_tokens: params.maxTokens,
      messages: [{ role: "user", content: params.prompt }],
    });

    const block = response.content[0];
    const text = block?.type === "text" ? block.text : "";

    console.log(`[${params.pipeline}]`, {
      model: params.model,
      tokens_est_in: inputEstimate,
      outcome: text.trim() ? "success" : "empty_response",
    });

    if (!text.trim()) {
      return { ok: false, error: "empty_response", model: params.model };
    }

    return { ok: true, text, model: params.model };
  } catch (err) {
    const message = err instanceof Error ? err.message : "api_error";
    console.error(`[${params.pipeline}]`, {
      model: params.model,
      tokens_est_in: inputEstimate,
      outcome: "api_error",
      error: message.slice(0, 200),
    });
    return { ok: false, error: message, model: params.model };
  }
}
