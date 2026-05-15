import { z } from "zod";

import { EVENT_TYPES, SOURCE_TYPES } from "@/modules/events/constants";

export const monitoringRuleFiltersSchema = z.object({
  min_signal_score: z.number().int().min(0).max(100).default(75),
  event_types: z.array(z.enum(EVENT_TYPES)).default([]),
  source_types: z.array(z.enum(SOURCE_TYPES)).default([]),
  recency_hours: z.number().int().positive().default(168),
});

export type MonitoringRuleFilters = z.infer<typeof monitoringRuleFiltersSchema>;

export type RuleEvaluationEvent = {
  id: string;
  entity_id: string;
  event_type: string;
  source_type: string;
  signal_score: number;
  title: string;
  summary: string;
  detected_at: string;
};

export type MonitoringRuleRow = {
  id: string;
  organization_id: string;
  entity_id: string | null;
  name: string;
  is_active: boolean;
  min_signal_score: number;
  event_types: string[];
  source_types: string[];
  recency_hours: number;
  trigger_count: number;
};

export type RuleMatchResult = {
  matched: boolean;
  reasons: string[];
};
