import { z } from "zod";

import { EVENT_TYPES, SOURCE_TYPES } from "./constants";

const optionalUrl = z.union([
  z.literal(""),
  z.string().trim().url("Enter a valid URL."),
]);

export const manualCreateEventFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  summary: z.string().trim().min(1, "Summary is required.").max(4000),
  implication: z.string().trim().max(4000).optional().or(z.literal("")),
  raw_content: z.string().trim().max(20000).optional().or(z.literal("")),
  source_url: optionalUrl,
  source_type: z.enum(SOURCE_TYPES),
  event_type: z.enum(EVENT_TYPES),
  signal_score: z.coerce
    .number()
    .int()
    .min(0, "Score must be at least 0.")
    .max(100, "Score cannot exceed 100."),
  published_at: z.string().trim().optional().or(z.literal("")),
  metadata_json: z.string().max(16000).optional().or(z.literal("")),
});

export type ManualCreateEventFormInput = z.infer<
  typeof manualCreateEventFormSchema
>;

export const updateSignalScoreFormSchema = z.object({
  signal_score: z.coerce
    .number()
    .int()
    .min(0)
    .max(100),
});

export const entityEventsListQuerySchema = z
  .object({
    dismissed: z.enum(["0", "1"]).optional(),
  })
  .transform((o) => ({
    includeDismissed: o.dismissed === "1",
  }));

export type EntityEventsListQuery = z.infer<typeof entityEventsListQuerySchema>;
