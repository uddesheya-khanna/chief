import Link from "next/link";

import type { IntelligenceDigestRow } from "@/modules/digests/loaders";
import { entitySignalDetailHref } from "@/modules/events/event-url";
import { EVENT_TYPE_LABEL } from "@/modules/events/constants";
import { workspaceHref } from "@/modules/shell/nav";

type DigestContent = {
  executive_summary?: string;
  key_movements?: { heading: string; body: string }[];
  recommended_actions?: string[];
  top_signals?: {
    id: string;
    entityId: string;
    title: string;
    summary: string;
    signalScore: number;
    eventType: string;
  }[];
  confidence?: number;
};

export function DigestReader({
  orgSlug,
  digest,
}: {
  orgSlug: string;
  digest: IntelligenceDigestRow;
}) {
  const content = (digest.content ?? {}) as DigestContent;

  return (
    <article className="space-y-8">
      <header className="space-y-2 border-b border-border/60 pb-6">
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {digest.digest_type.replace(/_/g, " ")}
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {digest.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {digest.period_start.slice(0, 10)} — {digest.period_end.slice(0, 10)}
          {content.confidence != null
            ? ` · confidence ${Math.round(content.confidence * 100)}%`
            : ""}
        </p>
      </header>

      {content.executive_summary ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">
            Executive summary
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {content.executive_summary}
          </p>
        </section>
      ) : null}

      {content.key_movements && content.key_movements.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Key movements</h2>
          <ul className="space-y-3">
            {content.key_movements.map((m) => (
              <li
                key={m.heading}
                className="rounded-lg border border-border/60 bg-card/30 px-4 py-3"
              >
                <p className="text-sm font-medium text-foreground">{m.heading}</p>
                <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.top_signals && content.top_signals.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Source signals</h2>
          <ul className="divide-y divide-border/60 rounded-lg border border-border/70">
            {content.top_signals.map((s) => (
              <li key={s.id} className="px-4 py-3">
                <Link
                  href={entitySignalDetailHref(orgSlug, s.entityId, s.id)}
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {s.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
                  {s.summary}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Score {s.signalScore} ·{" "}
                  {EVENT_TYPE_LABEL[
                    s.eventType as keyof typeof EVENT_TYPE_LABEL
                  ] ?? s.eventType}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.recommended_actions && content.recommended_actions.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">
            Recommended actions
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {content.recommended_actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-[12px] text-muted-foreground">
        <Link href={workspaceHref(orgSlug, "/digests")} className="hover:underline">
          ← All digests
        </Link>
      </p>
    </article>
  );
}
