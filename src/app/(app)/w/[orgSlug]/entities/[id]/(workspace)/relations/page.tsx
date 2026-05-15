import { notFound } from "next/navigation";

import {
  getTrackedEntity,
  listTrackedEntities,
} from "@/modules/entities/loaders";
import { listEntityRelationships } from "@/modules/relationships/loaders";
import { EntityRelationshipsPanel } from "@/modules/relationships/components/entity-relationships-panel";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function EntityRelationsPage({
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

  const [relationships, peers] = await Promise.all([
    listEntityRelationships(ctx.supabase, ctx.organization.id, id),
    listTrackedEntities(ctx.supabase, ctx.organization.id, {
      status: "active",
      type: undefined,
      q: undefined,
    }),
  ]);

  return (
    <EntityRelationshipsPanel
      orgSlug={orgSlug}
      entity={entity}
      relationships={relationships}
      peerEntities={peers}
    />
  );
}
