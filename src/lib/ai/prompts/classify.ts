import { EVENT_TYPES } from "@/modules/events/constants";

export type ClassifyPromptInput = {
  entityName: string;
  entityType: string;
  sourceType: string;
  sourceUrl: string;
  diffSummary: string;
  contentExcerpt: string;
};

export function CLASSIFY_EVENT_PROMPT(input: ClassifyPromptInput): string {
  const types = EVENT_TYPES.join('", "');

  return `You are a strategic intelligence analyst for a founder office. Classify a detected website change.

Respond ONLY with valid JSON matching this schema exactly:
{
  "event_type": "${types}",
  "is_significant": boolean,
  "confidence": number between 0 and 1,
  "reasoning": string (max 200 characters, cite specific evidence from the diff)
}

Entity: ${input.entityName} (${input.entityType})
Source: ${input.sourceType} — ${input.sourceUrl}

Diff summary:
${input.diffSummary}

Content excerpt (ground truth — do not invent facts not present here):
${input.contentExcerpt}

Rules:
- is_significant is true only if this would materially affect competitive or GTM decisions
- Use compliance_security for security, privacy, compliance, or trust-related changes
- Use positioning_change for messaging, ICP, or category repositioning without a clear product launch
- Use market_expansion for new regions, segments, or verticals
- If evidence is weak, set event_type to "other", is_significant to false, confidence below 0.5
- No markdown fences. JSON only.`;
}
