import { notFound, redirect } from "next/navigation";

import { hybridIntelligenceSearch } from "@/lib/embeddings/search";
import { WorkspaceSearchView } from "@/modules/search/components/workspace-search-view";
import {
  parseWorkspaceSearchQuery,
  serializeWorkspaceSearchQuery,
  WORKSPACE_SEARCH_PAGE_SIZE,
  workspaceSearchHref,
} from "@/modules/search/search-params";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function SearchPage({
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

  const query = parseWorkspaceSearchQuery(await searchParams);

  let searchResult = null;
  if (query.query) {
    const offset = (query.page - 1) * WORKSPACE_SEARCH_PAGE_SIZE;
    searchResult = await hybridIntelligenceSearch(ctx.supabase, {
      organizationId: ctx.organization.id,
      query: query.query,
      limit: WORKSPACE_SEARCH_PAGE_SIZE,
      offset,
      entityTypes:
        query.entityTypes.length > 0 ? query.entityTypes : undefined,
      eventTypes: query.eventTypes.length > 0 ? query.eventTypes : undefined,
      minSignalScore: query.minSignalScore ?? undefined,
    });

    const totalPages = Math.max(
      1,
      Math.ceil(searchResult.total / WORKSPACE_SEARCH_PAGE_SIZE),
    );
    if (query.page > totalPages) {
      redirect(
        workspaceSearchHref(
          orgSlug,
          serializeWorkspaceSearchQuery({ ...query, page: totalPages }),
        ),
      );
    }
  }

  return (
    <WorkspaceSearchView
      orgSlug={orgSlug}
      organizationId={ctx.organization.id}
      query={query}
      searchResult={searchResult}
      supabase={ctx.supabase}
    />
  );
}
