/**
 * Strip markdown fences and parse JSON from LLM text responses.
 */
export function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

export function parseJsonFromLlm(text: string): unknown {
  const cleaned = stripMarkdownFences(text);
  if (!cleaned) {
    throw new Error("empty_llm_response");
  }
  return JSON.parse(cleaned);
}

export function sanitizePromptInput(text: string, maxLength: number): string {
  return text
    .replace(/\0/g, "")
    .slice(0, maxLength)
    .trim();
}
