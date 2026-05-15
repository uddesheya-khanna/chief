import type { DiffResult } from "@/lib/ingestion/types";

import type { EventType } from "@/modules/events/constants";

export function inferEventTypeFromDiff(
  diff: DiffResult,
  sourceType: "website" | "pricing_page",
): EventType {
  const blob = [...diff.additions, ...diff.removals].join("\n").toLowerCase();

  if (sourceType === "pricing_page") {
    return "pricing_change";
  }

  if (
    /pricing|price|\$|per month|subscription|plan tier/.test(blob)
  ) {
    return "pricing_change";
  }
  if (/launch|released|introducing|now available|general availability/.test(blob)) {
    return "product_launch";
  }
  if (/hiring|open roles|careers|job openings|we're hiring/.test(blob)) {
    return "hiring_surge";
  }
  if (/funding|raised|series [a-d]|investment|valuation/.test(blob)) {
    return "funding";
  }
  if (/ceo|cto|chief|appointed|joins as|executive/.test(blob)) {
    return "exec_move";
  }
  if (/partnership|partner with|integrat(e|ion)|collaborat/.test(blob)) {
    return "partnership";
  }
  if (/positioning|messaging|value prop|target market|icp/.test(blob)) {
    return "positioning_change";
  }
  if (/expand|new market|international|region|global|entering/.test(blob)) {
    return "market_expansion";
  }
  if (/security|compliance|soc 2|gdpr|privacy|trust center|certification/.test(
    blob,
  )) {
    return "compliance_security";
  }

  return "other";
}

export function buildEventTitle(
  entityName: string,
  eventType: EventType,
  sourceType: "website" | "pricing_page",
): string {
  if (eventType === "pricing_change") {
    return `${entityName} — pricing page update detected`;
  }
  if (sourceType === "pricing_page") {
    return `${entityName} — change on pricing page`;
  }
  return `${entityName} — website content update`;
}

export function scoreFromChange(diff: DiffResult, eventType: EventType): number {
  let score = 50;
  if (diff.changeRatio > 0.2) {
    score += 15;
  }
  if (eventType === "pricing_change") {
    score += 25;
  } else if (eventType === "product_launch" || eventType === "funding") {
    score += 18;
  } else if (eventType === "hiring_surge") {
    score += 12;
  }
  return Math.min(100, Math.max(0, score));
}
