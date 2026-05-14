import Link from "next/link";

import { PageHeader } from "@/components/primitives/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ENTITY_TYPE_LABEL,
  isEntityType,
} from "@/modules/entities/constants";
import { listTrackedEntities } from "@/modules/entities/loaders";
import { parseEntityListQuery } from "@/modules/entities/search-params";
import {
  getWorkspaceIntelligenceMetrics,
  listRecentWorkspaceFeedEvents,
} from "@/modules/events/loaders";
import { FeedIntelligenceRow } from "@/modules/feed/components/feed-intelligence-row";
import { workspaceFeedHref } from "@/modules/feed/feed-href";
import { getWorkspaceContext } from "@/modules/org/workspace-context";
import { workspaceHref } from "@/modules/shell/nav";
import { notFound } from "next/navigation";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    notFound();
  }

  const orgId = ctx.organization.id;

  const [metrics, recent, entities] = await Promise.all([
    getWorkspaceIntelligenceMetrics(ctx.supabase, orgId),
    listRecentWorkspaceFeedEvents(ctx.supabase, orgId, 8),
    listTrackedEntities(
      ctx.supabase,
      orgId,
      parseEntityListQuery({}),
    ),
  ]);

  const topEntities = entities.slice(0, 10);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Dashboard"
        description="Operational snapshot for this workspace — recent signals, counts, and tracked entities at a glance."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Active entities" value={metrics.activeEntityCount} />
        <Metric label="Open signals" value={metrics.openSignalCount} />
        <Metric label="Signals (7d)" value={metrics.signalsLast7Days} />
        <Metric
          label="Top score (7d)"
          value={metrics.topSignalScore7d ?? "—"}
          mono
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Recent signals
            </h2>
            <Link
              href={workspaceFeedHref(orgSlug)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 text-xs",
              )}
            >
              Open feed
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 px-4 py-10 text-center text-sm text-muted-foreground">
              No open signals yet. Use the feed or add a manual signal on an
              entity.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/70 bg-card/30">
              {recent.map((ev) => (
                <FeedIntelligenceRow key={ev.id} orgSlug={orgSlug} event={ev} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-3 lg:sticky lg:top-24">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Tracked entities
          </h2>
          <div className="overflow-hidden rounded-lg border border-border/70 bg-card/40">
            {topEntities.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No active entities.{" "}
                <Link
                  href={workspaceHref(orgSlug, "/entities")}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Add in directory
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {topEntities.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={workspaceHref(orgSlug, `/entities/${e.id}`)}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                    >
                      <span className="min-w-0 truncate font-medium text-foreground">
                        {e.name}
                      </span>
                      <span className="shrink-0 text-[12px] text-muted-foreground">
                        {isEntityType(e.type)
                          ? ENTITY_TYPE_LABEL[e.type]
                          : e.type}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  mono,
}: {
  label: string;
  value: number | string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/50 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-medium tabular-nums tracking-tight text-foreground",
          mono && "font-mono text-[1.35rem]",
        )}
      >
        {value}
      </p>
    </div>
  );
}
