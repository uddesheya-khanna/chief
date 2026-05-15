export const RELATIONSHIP_TYPES = [
  "competes_with",
  "invested_in",
  "partnered_with",
  "supplies",
  "markets_with",
  "executive_at",
  "acquired",
  "other",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_TYPE_LABEL: Record<RelationshipType, string> = {
  competes_with: "Competes with",
  invested_in: "Invested in",
  partnered_with: "Partnered with",
  supplies: "Supplies",
  markets_with: "Markets with",
  executive_at: "Executive at",
  acquired: "Acquired",
  other: "Related",
};
