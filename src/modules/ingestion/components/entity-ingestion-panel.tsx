import {
  INGESTION_RESULT_LABEL,
  INGESTION_STATUS_LABEL,
} from "@/modules/ingestion/constants";
import { IngestionJobHistory } from "@/modules/ingestion/components/ingestion-job-history";
import { IngestionRunForm } from "@/modules/ingestion/components/ingestion-run-form";
import type { EntityIngestionSummary } from "@/modules/ingestion/loaders";
import type { TrackedEntityRow } from "@/modules/entities/loaders";
import {
  INGESTION_JOB_STATUSES,
  INGESTION_RESULT_TYPES,
  type IngestionJobStatus,
  type IngestionResultType,
} from "@/lib/ingestion/types";
import { cn } from "@/lib/utils";

function formatWhen(iso: string | null) {
  if (!iso) {
    return "Never";
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function isStatus(v: string): v is IngestionJobStatus {
  return (INGESTION_JOB_STATUSES as readonly string[]).includes(v);
}

function isResult(v: string | null): v is IngestionResultType {
  return v !== null && (INGESTION_RESULT_TYPES as readonly string[]).includes(v);
}

export function EntityIngestionPanel({
  orgSlug,
  entity,
  summary,
  compact = false,
}: {
  orgSlug: string;
  entity: TrackedEntityRow;
  summary: EntityIngestionSummary;
  compact?: boolean;
}) {
  const canCrawl = entity.is_active && Boolean(entity.domain?.trim());
  const last = summary.lastJob;
  const lastStatus = last && isStatus(last.status) ? last.status : null;
  const lastResult =
    last?.result_type && isResult(last.result_type) ? last.result_type : null;

  return (
    <section className={cn("space-y-4", compact && "space-y-3")}>
      <div className="space-y-1">
        <h2
          className={cn(
            "font-heading font-semibold tracking-tight text-foreground",
            compact ? "text-base" : "text-lg",
          )}
        >
          Website monitoring
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Crawl homepage and pricing pages, diff snapshots, and emit rule-based
          signals when meaningful changes appear.
        </p>
      </div>

      <div className="rounded-lg border border-border/70 bg-card/40 p-4 sm:p-5">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Last crawl
            </dt>
            <dd className="text-sm text-foreground">
              {formatWhen(last?.completed_at ?? last?.created_at ?? null)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Status
            </dt>
            <dd className="text-sm text-foreground">
              {lastStatus ? INGESTION_STATUS_LABEL[lastStatus] : "—"}
              {lastResult ? (
                <span className="text-muted-foreground">
                  {" "}
                  · {INGESTION_RESULT_LABEL[lastResult]}
                </span>
              ) : null}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Last successful check
            </dt>
            <dd className="text-sm text-foreground">
              {formatWhen(summary.lastSuccessAt)}
            </dd>
          </div>
        </dl>

        {!entity.is_active ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Resume monitoring on this entity to enable crawls.
          </p>
        ) : !entity.domain?.trim() ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Add a domain in the profile editor before website monitoring can run.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
            <IngestionRunForm
              orgSlug={orgSlug}
              entityId={entity.id}
              sourceType="website"
              label="Crawl homepage"
            />
            <IngestionRunForm
              orgSlug={orgSlug}
              entityId={entity.id}
              sourceType="pricing_page"
              label="Crawl pricing"
            />
          </div>
        )}

        {canCrawl ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Crawls run immediately and may take up to a minute. Duplicate URLs
            within 24 hours are skipped.
          </p>
        ) : null}
      </div>

      {!compact ? <IngestionJobHistory jobs={summary.recentJobs} /> : null}
    </section>
  );
}
