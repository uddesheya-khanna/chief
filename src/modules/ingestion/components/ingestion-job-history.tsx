import {
  INGESTION_RESULT_LABEL,
  INGESTION_SOURCE_LABEL,
  INGESTION_STATUS_LABEL,
} from "@/modules/ingestion/constants";
import type { IngestionJobRow } from "@/modules/ingestion/loaders";
import {
  INGESTION_JOB_STATUSES,
  INGESTION_RESULT_TYPES,
  type IngestionJobStatus,
  type IngestionResultType,
} from "@/lib/ingestion/types";

function formatWhen(iso: string | null) {
  if (!iso) {
    return "—";
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

export function IngestionJobHistory({ jobs }: { jobs: IngestionJobRow[] }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 px-4 py-10 text-center">
        <p className="text-sm font-medium text-foreground">No crawl history yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Run a homepage or pricing crawl to establish monitoring for this entity.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/70">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/20">
            <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              When
            </th>
            <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Source
            </th>
            <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Result
            </th>
            <th className="hidden px-4 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground md:table-cell">
              Summary
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const status = isStatus(job.status) ? job.status : "failed";
            const result =
              job.result_type && isResult(job.result_type)
                ? job.result_type
                : null;
            const sourceKey = job.source_type as keyof typeof INGESTION_SOURCE_LABEL;

            return (
              <tr
                key={job.id}
                className="border-b border-border/50 last:border-b-0 hover:bg-muted/20"
              >
                <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground tabular-nums">
                  {formatWhen(job.completed_at ?? job.created_at)}
                </td>
                <td className="px-4 py-3 text-[13px] text-foreground">
                  {INGESTION_SOURCE_LABEL[sourceKey] ?? job.source_type}
                </td>
                <td className="px-4 py-3 text-[13px]">
                  {INGESTION_STATUS_LABEL[status]}
                </td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground">
                  {result ? INGESTION_RESULT_LABEL[result] : "—"}
                </td>
                <td className="hidden max-w-md px-4 py-3 text-[13px] text-muted-foreground md:table-cell">
                  {job.error_message?.trim()
                    ? job.error_message
                    : job.diff_summary?.trim()
                      ? job.diff_summary
                      : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
