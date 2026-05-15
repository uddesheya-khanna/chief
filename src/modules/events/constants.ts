export const SOURCE_TYPES = [
  "website",
  "news",
  "job_board",
  "linkedin",
  "sec",
  "manual",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const EVENT_TYPES = [
  "pricing_change",
  "product_launch",
  "hiring_surge",
  "funding",
  "exec_move",
  "partnership",
  "positioning_change",
  "market_expansion",
  "compliance_security",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  pricing_change: "Pricing",
  product_launch: "Product",
  hiring_surge: "Hiring",
  funding: "Funding",
  exec_move: "Leadership",
  partnership: "Partnership",
  positioning_change: "Positioning",
  market_expansion: "Expansion",
  compliance_security: "Compliance",
  other: "Other",
};

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  website: "Website",
  news: "News",
  job_board: "Jobs",
  linkedin: "LinkedIn",
  sec: "SEC",
  manual: "Manual",
};

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value);
}

export function isSourceType(value: string): value is SourceType {
  return (SOURCE_TYPES as readonly string[]).includes(value);
}

/** Design tokens: high ≥80, medium 50–79, low below 50 */
export function signalBand(
  score: number,
): "high" | "medium" | "low" {
  if (score >= 80) {
    return "high";
  }
  if (score >= 50) {
    return "medium";
  }
  return "low";
}
