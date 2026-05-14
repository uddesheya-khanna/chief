import Link from "next/link";
import { Plus } from "lucide-react";

import { canUseManualEventTools } from "@/actions/events";
import { PageHeader } from "@/components/primitives/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTrackedEntity } from "@/modules/entities/loaders";
import { SignalsDataTable } from "@/modules/events/components/signals-data-table";
import { entitySignalNewHref } from "@/modules/events/event-url";
import { listIntelligenceEventsForEntity } from "@/modules/events/loaders";
import { getWorkspaceContext } from "@/modules/org/workspace-context";
import { notFound } from "next/navigation";

export default async function EntitySignalsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    notFound();
  }

  const entity = await getTrackedEntity(ctx.supabase, ctx.organization.id, id);
  if (!entity) {
    notFound();
  }

  const events = await listIntelligenceEventsForEntity(
    ctx.supabase,
    ctx.organization.id,
    id,
    { includeDismissed: true, limit: 200 },
  );

  const manualEnabled = await canUseManualEventTools();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Signals"
        description={`All intelligence events for ${entity.name}, including dismissed items.`}
      >
        {manualEnabled ? (
          <Link
            href={entitySignalNewHref(orgSlug, id)}
            className={cn(
              buttonVariants({ size: "sm" }),
              "inline-flex shrink-0 items-center gap-1.5",
            )}
          >
            <Plus className="size-4" />
            Add manual signal
          </Link>
        ) : null}
      </PageHeader>

      {!manualEnabled ? (
        <p className="text-sm text-muted-foreground">
          Manual signal creation is disabled in production. Set{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            ALLOW_MANUAL_INTELLIGENCE_EVENTS=true
          </code>{" "}
          to enable for workspace seeding.
        </p>
      ) : null}

      <SignalsDataTable orgSlug={orgSlug} entityId={id} events={events} />
    </div>
  );
}
