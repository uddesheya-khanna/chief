export const AI_MODEL_CLASSIFY = "claude-haiku-4-5-20251001";
export const AI_MODEL_SUMMARIZE = "claude-sonnet-4-6";
export const AI_MODEL_IMPLICATION = "claude-sonnet-4-6";

export type PipelineOutcome = "success" | "parse_failure" | "api_error" | "skipped";

export type PipelineStepLog = {
  classify: PipelineOutcome;
  summarize: PipelineOutcome;
  implication: PipelineOutcome;
};
