import { notFound } from "next/navigation";

import { PageHeader } from "@/components/primitives/page-header";
import { listTrackedEntities } from "@/modules/entities/loaders";
import { parseEntityListQuery } from "@/modules/entities/search-params";
import { getWorkspaceContext } from "@/modules/org/workspace-context";
import { WatchWorkspacePanel } from "@/modules/workflow/components/watch-workspace-panel";
import {
  listBookmarkedEventIds,
  listPinnedEntityIds,
  listUserCollections,
} from "@/modules/workflow/loaders";
import { listRecentWorkspaceFeedEvents } from "@/modules/events/loaders";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    notFound();
  }

  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  const orgId = ctx.organization.id;

  const [collections, bookmarkedIds, pinnedIds, recent, entities] =
    await Promise.all([
      listUserCollections(ctx.supabase, orgId, user.id),
      listBookmarkedEventIds(ctx.supabase, orgId, user.id),
      listPinnedEntityIds(ctx.supabase, orgId, user.id),
      listRecentWorkspaceFeedEvents(ctx.supabase, orgId, 12),
      listTrackedEntities(
        ctx.supabase,
        orgId,
        parseEntityListQuery({ status: "active" }),
      ),
    ]);

  const bookmarkedEvents = recent.filter((e) => bookmarkedIds.has(e.id));
  const pinnedEntities = entities.filter((e) => pinnedIds.has(e.id));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Watch"
        description="Bookmarks, pinned entities, and personal collections — your workflow layer on top of institutional memory."
      />
      <WatchWorkspacePanel
        orgSlug={orgSlug}
        collections={collections}
        bookmarkedEvents={bookmarkedEvents}
        pinnedEntities={pinnedEntities}
      />
    </div>
  );
}
