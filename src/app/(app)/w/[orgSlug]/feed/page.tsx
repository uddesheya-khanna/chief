import { notFound } from "next/navigation";

import { queryWorkspaceIntelligenceFeed } from "@/modules/events/loaders";
import { WorkspaceFeedView } from "@/modules/feed/components/workspace-feed-view";
import { parseWorkspaceFeedQuery } from "@/modules/feed/search-params";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function FeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    notFound();
  }

  const feedQuery = parseWorkspaceFeedQuery(await searchParams);
  const { events, total, error } = await queryWorkspaceIntelligenceFeed(
    ctx.supabase,
    ctx.organization.id,
    feedQuery,
  );

  return (
    <WorkspaceFeedView
      orgSlug={orgSlug}
      query={feedQuery}
      events={events}
      total={total}
      errorMessage={error}
    />
  );
}
