export type ImplicationPromptInput = {
  entityName: string;
  entityType: string;
  eventType: string;
  title: string;
  summary: string;
  orgProduct?: string;
  orgMarket?: string;
  orgStage?: string;
};

export function GENERATE_IMPLICATION_PROMPT(input: ImplicationPromptInput): string {
  const orgLines: string[] = [];
  if (input.orgProduct?.trim()) {
    orgLines.push(`Our product: ${input.orgProduct.trim()}`);
  }
  if (input.orgMarket?.trim()) {
    orgLines.push(`Our market: ${input.orgMarket.trim()}`);
  }
  if (input.orgStage?.trim()) {
    orgLines.push(`Our stage: ${input.orgStage.trim()}`);
  }

  const orgBlock =
    orgLines.length > 0
      ? `\nOur organization context:\n${orgLines.join("\n")}\n`
      : "\n(No organization context provided — keep implications general but still specific to the event.)\n";

  return `You are a chief of staff writing one strategic implication for a founder.

Respond ONLY with valid JSON:
{
  "implication": string (2-4 sentences, max 400 chars, operational — what to watch or validate)
}

Tracked entity: ${input.entityName} (${input.entityType})
Event type: ${input.eventType}
Title: ${input.title}
Summary: ${input.summary}
${orgBlock}
Rules:
- Frame as an inference, not a fact ("may", "suggests", "worth validating")
- Tie to competitive or GTM relevance when possible
- No generic advice ("monitor closely", "stay agile")
- No markdown fences. JSON only.`;
}
