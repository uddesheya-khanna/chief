export type SummarizePromptInput = {
  entityName: string;
  entityType: string;
  eventType: string;
  sourceUrl: string;
  diffSummary: string;
  contentExcerpt: string;
};

export function SUMMARIZE_EVENT_PROMPT(input: SummarizePromptInput): string {
  return `You are writing operational intelligence for a founder office. Summarize a detected change in plain, factual language.

Respond ONLY with valid JSON:
{
  "title": string (max 120 chars, specific — name the entity and what changed),
  "summary": string (2-3 sentences, factual, no hype),
  "key_facts": string[] (max 5 bullets, each under 120 chars, only facts supported by the excerpt)
}

Entity: ${input.entityName} (${input.entityType})
Classification: ${input.eventType}
Source: ${input.sourceUrl}

Diff summary:
${input.diffSummary}

Content excerpt:
${input.contentExcerpt}

Style:
- Strategy memo tone: direct, operational, restrained
- Do not use words like "exciting", "innovative", "game-changing"
- Do not claim certainty beyond the excerpt
- Reference concrete details (plans, prices, roles, regions) when present
- JSON only, no markdown fences`;
}
