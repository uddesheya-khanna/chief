import {
  formatConfidence,
  parseEventAiMetadata,
  pipelineOutcomeLabel,
} from "@/modules/events/ai-metadata";
import type { Json } from "@/types/database";

export function EventIntelligenceMeta({ metadata }: { metadata: Json }) {
  const ai = parseEventAiMetadata(metadata);
  if (!ai) {
    return null;
  }

  const topFactors = ai.scoring.factors
    .filter((f) => Math.abs(f.contribution) >= 4)
    .slice(0, 4);

  return (
    <section className="space-y-4 rounded-lg border border-border/60 bg-muted/15 p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Signal analysis
        </h2>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Classification and scoring from the ingestion pipeline. Review the
          primary source before acting on implications.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Classification confidence
          </dt>
          <dd className="font-mono text-sm text-foreground tabular-nums">
            {formatConfidence(ai.classification.confidence)}
            <span className="ml-2 font-sans text-muted-foreground">
              · {ai.classification.source === "ai" ? "AI" : "Rule fallback"}
            </span>
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Severity
          </dt>
          <dd className="text-sm capitalize text-foreground">
            {ai.scoring.severity}
          </dd>
        </div>
        {ai.ingestionJobId ? (
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Ingestion trace
            </dt>
            <dd className="font-mono text-[12px] break-all text-muted-foreground">
              Job {ai.ingestionJobId}
              {ai.sourceType ? ` · ${ai.sourceType}` : ""}
              {typeof ai.changeRatio === "number"
                ? ` · ${(ai.changeRatio * 100).toFixed(1)}% content change`
                : ""}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Classification reasoning
        </p>
        <p className="text-sm leading-relaxed text-foreground">
          {ai.classification.reasoning}
        </p>
      </div>

      {topFactors.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Score factors
          </p>
          <ul className="space-y-1.5 text-[13px] text-muted-foreground">
            {topFactors.map((factor) => (
              <li
                key={factor.label}
                className="flex justify-between gap-4 border-b border-border/40 pb-1 last:border-b-0"
              >
                <span>{factor.label}</span>
                <span className="font-mono tabular-nums text-foreground/80">
                  {factor.contribution > 0 ? "+" : ""}
                  {factor.contribution}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-[12px] text-muted-foreground">
        Pipeline · classify {pipelineOutcomeLabel(ai.pipeline.outcomes.classify)}
        , summarize {pipelineOutcomeLabel(ai.pipeline.outcomes.summarize)}, implication{" "}
        {pipelineOutcomeLabel(ai.pipeline.outcomes.implication)}
      </p>
    </section>
  );
}
