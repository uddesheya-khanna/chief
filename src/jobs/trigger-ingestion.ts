/**
 * Trigger.dev adapter (optional).
 *
 * Install `@trigger.dev/sdk`, define a task that calls `executeIngestionJob`
 * from `@/jobs/ingestion`, and schedule it from `scheduleEntityIngestion`.
 *
 * Until then, use:
 * - `triggerEntityIngestion` Server Action (immediate crawl from entity settings)
 * - POST `/api/v1/ingestion/cron` with `Authorization: Bearer $CRON_SECRET`
 */

export const TRIGGER_INGESTION_TASK_ID = "entity-ingestion-run";
