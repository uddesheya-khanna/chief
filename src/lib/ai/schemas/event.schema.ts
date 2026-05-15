import { z } from "zod";

import { EVENT_TYPES } from "@/modules/events/constants";

export const IntelligenceEventTypeSchema = z.enum(EVENT_TYPES);

export type IntelligenceEventType = z.infer<typeof IntelligenceEventTypeSchema>;

export const ClassifiedEventSchema = z.object({
  event_type: IntelligenceEventTypeSchema,
  is_significant: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(300),
});

export type ClassifiedEvent = z.infer<typeof ClassifiedEventSchema>;

export const SummarizedEventSchema = z.object({
  title: z.string().min(8).max(200),
  summary: z.string().min(20).max(600),
  key_facts: z.array(z.string().max(200)).max(5).optional().default([]),
});

export type SummarizedEvent = z.infer<typeof SummarizedEventSchema>;

export const ImplicationResultSchema = z.object({
  implication: z.string().min(20).max(500),
});

export type ImplicationResult = z.infer<typeof ImplicationResultSchema>;

export const AiClassificationMetadataSchema = z.object({
  event_type: IntelligenceEventTypeSchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(300),
  source: z.enum(["ai", "fallback"]),
  is_significant: z.boolean(),
});

export const AiScoringMetadataSchema = z.object({
  score: z.number().int().min(0).max(100),
  severity: z.enum(["high", "medium", "low"]),
  factors: z.array(
    z.object({
      label: z.string().max(80),
      contribution: z.number(),
    }),
  ),
});

export const AiPipelineMetadataSchema = z.object({
  version: z.literal("1"),
  models: z.object({
    classify: z.string().optional(),
    summarize: z.string().optional(),
    implication: z.string().optional(),
  }),
  outcomes: z.object({
    classify: z.enum(["success", "parse_failure", "api_error", "skipped"]),
    summarize: z.enum(["success", "parse_failure", "api_error", "skipped"]),
    implication: z.enum(["success", "parse_failure", "api_error", "skipped"]),
  }),
});

export const AiEventMetadataSchema = z.object({
  classification: AiClassificationMetadataSchema,
  scoring: AiScoringMetadataSchema,
  pipeline: AiPipelineMetadataSchema,
});

export type AiEventMetadata = z.infer<typeof AiEventMetadataSchema>;
