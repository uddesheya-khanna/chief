import { notFound } from "next/navigation";

import { EventDetailView } from "@/modules/events/components/event-detail-view";
import { getIntelligenceEvent } from "@/modules/events/loaders";
import { getTrackedEntity } from "@/modules/entities/loaders";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string; eventId: string }>;
}) {
  const { orgSlug, id, eventId } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return { title: "Signal" };
  }
  const event = await getIntelligenceEvent(
    ctx.supabase,
    ctx.organization.id,
    eventId,
    { entityId: id },
  );
  if (!event) {
    return { title: "Signal" };
  }
  return { title: `${event.title} · Chief` };
}

export default async function EntitySignalDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string; eventId: string }>;
}) {
  const { orgSlug, id, eventId } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    notFound();
  }

  const entity = await getTrackedEntity(ctx.supabase, ctx.organization.id, id);
  if (!entity) {
    notFound();
  }

  const event = await getIntelligenceEvent(
    ctx.supabase,
    ctx.organization.id,
    eventId,
    { entityId: id },
  );
  if (!event) {
    notFound();
  }

  return (
    <EventDetailView
      orgSlug={orgSlug}
      entityId={id}
      entityName={entity.name}
      event={event}
    />
  );
}
