import Link from "next/link";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/primitives/page-header";
import type { HybridSearchResult } from "@/lib/embeddings/search";
import { searchTrackedEntities } from "@/lib/embeddings/search";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SearchResultRow } from "@/modules/search/components/search-result-row";
import { WorkspaceSearchForm } from "@/modules/search/components/workspace-search-form";
import {
  WORKSPACE_SEARCH_PAGE_SIZE,
  type WorkspaceSearchQuery,
  workspaceSearchHref,
  serializeWorkspaceSearchQuery,
} from "@/modules/search/search-params";
import type { Database } from "@/types/database";

export async function WorkspaceSearchView({
  orgSlug,
  organizationId,
  query,
  searchResult,
  supabase,
}: {
  orgSlug: string;
  organizationId: string;
  query: WorkspaceSearchQuery;
  searchResult: HybridSearchResult | null;
  supabase: SupabaseClient<Database>;
}) {
  const entityMatches =
    query.query.length > 0
      ? await searchTrackedEntities(supabase, organizationId, query.query, 8)
      : [];

  const hasQuery = query.query.length > 0;
  const hits = searchResult?.hits ?? [];
  const mode = searchResult?.mode ?? "keyword";
  const total = searchResult?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / WORKSPACE_SEARCH_PAGE_SIZE));

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <PageHeader
        title="Search"
        description="Hybrid semantic and keyword retrieval across your intelligence corpus. Ranked by relevance, signal quality, and recency."
      />

      <WorkspaceSearchForm query={query} />

      {hasQuery ? (
        <p className="text-sm text-muted-foreground">
          Showing results for{" "}
          <span className="font-medium text-foreground">
            &ldquo;{searchResult?.queryEcho ?? query.query}&rdquo;
          </span>
          {searchResult ? (
            <>
              {" "}
              · {mode} retrieval · {total} match{total === 1 ? "" : "es"}
            </>
          ) : null}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Enter a query to search titles, summaries, implications, and tracked
          entities.
        </p>
      )}

      {entityMatches.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Entities
          </h2>
          <ul className="flex flex-wrap gap-2">
            {entityMatches.map((entity) => (
              <li key={entity.id}>
                <Link
                  href={`/w/${orgSlug}/entities/${entity.id}`}
                  className="inline-flex items-center rounded-md border border-border/70 bg-muted/20 px-2.5 py-1 text-[13px] text-foreground transition-colors hover:bg-muted/40"
                >
                  {entity.name}
                  <span className="ml-1.5 text-muted-foreground">
                    {entity.type}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Search results" className="rounded-lg border border-border/70">
        {!hasQuery ? (
          <div className="px-6 py-14 text-center">
            <Search
              className="mx-auto mb-3 size-6 text-muted-foreground"
              aria-hidden
            />
            <p className="text-[15px] font-medium text-foreground">
              Search institutional memory
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Find related signals, recurring themes, and entity context across
              your workspace history.
            </p>
          </div>
        ) : hits.length === 0 ? (
          <div className="border-t border-dashed border-border/80 px-6 py-14 text-center">
            <p className="text-[15px] font-medium text-foreground">
              No results for &ldquo;{query.query}&rdquo;
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try broader terms or confirm recent signals are indexed.
            </p>
          </div>
        ) : (
          hits.map((hit) => (
            <SearchResultRow
              key={hit.eventId}
              orgSlug={orgSlug}
              hit={hit}
              mode={mode}
            />
          ))
        )}
      </section>

      {hasQuery && totalPages > 1 ? (
        <nav
          className="flex items-center justify-between text-sm text-muted-foreground"
          aria-label="Search pagination"
        >
          <span>
            Page {query.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {query.page > 1 ? (
              <Link
                href={workspaceSearchHref(
                  orgSlug,
                  serializeWorkspaceSearchQuery({
                    ...query,
                    page: query.page - 1,
                  }),
                )}
                className="rounded-md border border-border/70 px-3 py-1.5 hover:bg-muted/30"
              >
                Previous
              </Link>
            ) : null}
            {query.page < totalPages ? (
              <Link
                href={workspaceSearchHref(
                  orgSlug,
                  serializeWorkspaceSearchQuery({
                    ...query,
                    page: query.page + 1,
                  }),
                )}
                className="rounded-md border border-border/70 px-3 py-1.5 hover:bg-muted/30"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}

