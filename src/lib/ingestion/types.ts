export const INGESTION_JOB_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "skipped",
] as const;

export type IngestionJobStatus = (typeof INGESTION_JOB_STATUSES)[number];

export const INGESTION_RESULT_TYPES = [
  "new_content",
  "no_change",
  "error",
  "skipped_duplicate",
] as const;

export type IngestionResultType = (typeof INGESTION_RESULT_TYPES)[number];

export const INGESTION_SOURCE_TYPES = ["website", "pricing_page"] as const;

export type IngestionSourceType = (typeof INGESTION_SOURCE_TYPES)[number];

export type CrawlResult = {
  url: string;
  content: string;
  fetchedAt: Date;
  success: boolean;
  statusCode?: number;
  error?: string;
};

export type DiffResult = {
  hasMeaningfulChange: boolean;
  changeRatio: number;
  additions: string[];
  removals: string[];
  summary: string;
};

export type EntityIngestionTarget = {
  organizationId: string;
  entityId: string;
  entityName: string;
  entityType: string;
  sourceType: IngestionSourceType;
  sourceUrl: string;
};
