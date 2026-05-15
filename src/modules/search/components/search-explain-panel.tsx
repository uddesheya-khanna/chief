"use client";

import { useState } from "react";
import { Info } from "lucide-react";

import type { RankedSearchHit } from "@/lib/embeddings/types";

const MODE_LABEL = {
  hybrid: "Hybrid ranking",
  keyword: "Keyword match",
  semantic: "Semantic similarity",
} as const;

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function SearchExplainPanel({
  hit,
  mode,
}: {
  hit: RankedSearchHit;
  mode: keyof typeof MODE_LABEL;
}) {
  const [open, setOpen] = useState(false);
  const { explain } = hit;
  const rows = [
    { label: "Retrieval", value: MODE_LABEL[mode] },
    { label: "Semantic", value: pct(explain.semantic) },
    { label: "Keyword", value: pct(explain.keyword) },
    { label: "Signal score", value: pct(explain.signal) },
    { label: "Recency", value: pct(explain.recency) },
    { label: "Source quality", value: pct(explain.sourceQuality) },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        aria-expanded={open}
      >
        <Info className="size-3" aria-hidden />
        Why ranked
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-10 mt-1 w-52 rounded-lg border border-border/80 bg-card p-2.5 text-[11px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          <ul className="space-y-1 text-muted-foreground">
            {rows.map((row) => (
              <li key={row.label} className="flex justify-between gap-2">
                <span>{row.label}</span>
                <span className="font-mono tabular-nums text-foreground/80">
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
