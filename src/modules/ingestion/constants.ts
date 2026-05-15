import type { IngestionJobStatus, IngestionResultType } from "@/lib/ingestion/types";

export const INGESTION_STATUS_LABEL: Record<IngestionJobStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  skipped: "Skipped",
};

export const INGESTION_RESULT_LABEL: Record<IngestionResultType, string> = {
  new_content: "New signal",
  no_change: "No change",
  error: "Error",
  skipped_duplicate: "Duplicate skipped",
};

export const INGESTION_SOURCE_LABEL = {
  website: "Homepage",
  pricing_page: "Pricing page",
} as const;
