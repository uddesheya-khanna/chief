import type { DiffResult } from "@/lib/ingestion/types";

const MEANINGFUL_CHANGE_RATIO = 0.05;
const MIN_CHANGE_CHARS = 80;

const PRICING_KEYWORDS = [
  "pricing",
  "price",
  "$",
  "per month",
  "per seat",
  "plan",
  "tier",
  "subscription",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function lineDiff(previous: string, current: string): {
  additions: string[];
  removals: string[];
} {
  const prevLines = new Set(
    previous.split("\n").map((l) => l.trim()).filter(Boolean),
  );
  const currLines = new Set(
    current.split("\n").map((l) => l.trim()).filter(Boolean),
  );

  const additions: string[] = [];
  const removals: string[] = [];

  for (const line of currLines) {
    if (!prevLines.has(line)) {
      additions.push(line);
    }
  }
  for (const line of prevLines) {
    if (!currLines.has(line)) {
      removals.push(line);
    }
  }

  return { additions, removals };
}

function containsPricingSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return PRICING_KEYWORDS.some((kw) => lower.includes(kw));
}

export function computeDiff(previous: string, current: string): DiffResult {
  if (!previous.trim()) {
    const summary = current.slice(0, 400).trim();
    return {
      hasMeaningfulChange: current.trim().length >= MIN_CHANGE_CHARS,
      changeRatio: 1,
      additions: current.split("\n").filter(Boolean).slice(0, 20),
      removals: [],
      summary: summary || "Initial snapshot captured.",
    };
  }

  if (previous.trim() === current.trim()) {
    return {
      hasMeaningfulChange: false,
      changeRatio: 0,
      additions: [],
      removals: [],
      summary: "No textual changes detected.",
    };
  }

  const { additions, removals } = lineDiff(previous, current);
  const prevTokens = tokenize(previous);
  const currTokens = tokenize(current);
  const union = new Set([...prevTokens, ...currTokens]);
  let intersection = 0;
  const currSet = new Set(currTokens);
  for (const t of prevTokens) {
    if (currSet.has(t)) {
      intersection += 1;
    }
  }
  const changeRatio =
    union.size === 0 ? 0 : 1 - intersection / union.size;

  const deltaChars =
    additions.join(" ").length + removals.join(" ").length;
  const pricingSignal =
    containsPricingSignal(additions.join("\n")) ||
    containsPricingSignal(removals.join("\n"));

  const hasMeaningfulChange =
    changeRatio > MEANINGFUL_CHANGE_RATIO ||
    deltaChars >= MIN_CHANGE_CHARS ||
    pricingSignal;

  const summaryParts: string[] = [];
  if (additions.length > 0) {
    summaryParts.push(
      `Added ${additions.length} line(s), e.g. "${additions[0].slice(0, 120)}".`,
    );
  }
  if (removals.length > 0) {
    summaryParts.push(
      `Removed ${removals.length} line(s), e.g. "${removals[0].slice(0, 120)}".`,
    );
  }

  return {
    hasMeaningfulChange,
    changeRatio,
    additions: additions.slice(0, 30),
    removals: removals.slice(0, 30),
    summary:
      summaryParts.join(" ") ||
      `Content change ratio ${(changeRatio * 100).toFixed(1)}%.`,
  };
}
