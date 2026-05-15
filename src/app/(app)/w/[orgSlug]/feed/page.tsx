import { notFound, redirect } from "next/navigation";

import { queryWorkspaceIntelligenceFeed } from "@/modules/events/loaders";
import { workspaceFeedHref } from "@/modules/feed/feed-href";
import { WorkspaceFeedView } from "@/modules/feed/components/workspace-feed-view";
import { listBookmarkedEventIds } from "@/modules/workflow/loaders";
import {
  clampWorkspaceFeedPage,
  parseWorkspaceFeedQuery,
  serializeWorkspaceFeedQuery,
} from "@/modules/feed/search-params";
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

  const rawQuery = parseWorkspaceFeedQuery(await searchParams);
  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();

  const [{ events, total, error }, bookmarkedIds] = await Promise.all([
    queryWorkspaceIntelligenceFeed(ctx.supabase, ctx.organization.id, rawQuery),
    user
      ? listBookmarkedEventIds(ctx.supabase, ctx.organization.id, user.id)
      : Promise.resolve(new Set<string>()),
  ]);

  const feedQuery = clampWorkspaceFeedPage(rawQuery, total);
  if (feedQuery.page !== rawQuery.page) {
    redirect(
      workspaceFeedHref(orgSlug, serializeWorkspaceFeedQuery(feedQuery)),
    );
  }

  return (
    <WorkspaceFeedView
      orgSlug={orgSlug}
      query={feedQuery}
      events={events}
      total={total}
      errorMessage={error}
      bookmarkedIds={bookmarkedIds}
    />
  );
}
