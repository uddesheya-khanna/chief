import type { EventSummarySlice } from "@/lib/intelligence/aggregate";

export function EXECUTIVE_DIGEST_PROMPT(input: {
  digestType: string;
  periodLabel: string;
  workspaceName: string;
  signals: EventSummarySlice[];
}): string {
  const signalBlock = input.signals
    .slice(0, 12)
    .map(
      (s, i) =>
        `${i + 1}. [score ${s.signalScore}] ${s.title} (${s.eventType}) — ${s.summary.slice(0, 200)}`,
    )
    .join("\n");

  return `You are a chief of staff preparing an executive intelligence digest for ${input.workspaceName}.

Digest type: ${input.digestType}
Period: ${input.periodLabel}

Respond ONLY with valid JSON matching this schema:
{
  "executive_summary": string (2-4 sentences, specific, no hype),
  "key_movements": [{ "heading": string, "body": string }],
  "recommended_actions": [string],
  "confidence": number between 0 and 1
}

Signals to synthesize (ranked by importance):
${signalBlock || "No signals in period."}

Rules:
- Be concise and operational — founders read this under time pressure
- Reference specific developments from the signals
- recommended_actions are practical next steps, not generic strategy advice
- No markdown fences — JSON only`;
}
