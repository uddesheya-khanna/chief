import { notFound } from "next/navigation";

import { getTrackedEntity } from "@/modules/entities/loaders";
import { EntityMemoryPanel } from "@/modules/history/components/entity-memory-panel";
import { SignalTimeline } from "@/modules/events/components/signal-timeline";
import { listIntelligenceEventsForEntity } from "@/modules/events/loaders";
import { EntityIngestionPanel } from "@/modules/ingestion/components/entity-ingestion-panel";
import { getEntityIngestionSummary } from "@/modules/ingestion/loaders";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function EntityTimelinePage({
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

  const [events, ingestionSummary] = await Promise.all([
    listIntelligenceEventsForEntity(ctx.supabase, ctx.organization.id, id, {
      includeDismissed: false,
      limit: 100,
    }),
    getEntityIngestionSummary(ctx.supabase, ctx.organization.id, id),
  ]);

  return (
    <div className="space-y-8">
      <EntityIngestionPanel
        orgSlug={orgSlug}
        entity={entity}
        summary={ingestionSummary}
        compact
      />

      <EntityMemoryPanel orgSlug={orgSlug} entityId={id} events={events} />

      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Timeline
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Chronological intelligence for {entity.name}. Dismissed signals stay
            available under Signals.
          </p>
        </div>
        <SignalTimeline orgSlug={orgSlug} entityId={id} events={events} />
      </div>
    </div>
  );
}
