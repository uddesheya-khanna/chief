import { Zap } from "lucide-react";

import { PageHeader } from "@/components/primitives/page-header";
import type { FeedEventWithEntity } from "@/modules/events/loaders";
import { FeedIntelligenceRow } from "@/modules/feed/components/feed-intelligence-row";
import { FeedNewSignalsBanner } from "@/modules/feed/components/feed-new-signals-banner";
import { WorkspaceFeedFilters } from "@/modules/feed/components/workspace-feed-filters";
import { WorkspaceFeedPagination } from "@/modules/feed/components/workspace-feed-pagination";
import type { WorkspaceFeedQuery } from "@/modules/feed/search-params";
import { serializeWorkspaceFeedQuery } from "@/modules/feed/search-params";

export function WorkspaceFeedView({
  orgSlug,
  query,
  events,
  total,
  errorMessage,
  bookmarkedIds = new Set<string>(),
}: {
  orgSlug: string;
  query: WorkspaceFeedQuery;
  events: FeedEventWithEntity[];
  total: number;
  errorMessage?: string;
  bookmarkedIds?: Set<string>;
}) {
  const baseline = events[0]?.detected_at ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <PageHeader
        title="Intelligence feed"
        description="Chronological workspace signals. Filter by entity class, event type, score band, and time window. Dismiss items to keep the surface operational."
      />

      <WorkspaceFeedFilters
        key={serializeWorkspaceFeedQuery(query)}
        orgSlug={orgSlug}
        query={query}
      />

      <FeedNewSignalsBanner orgSlug={orgSlug} baselineDetectedAt={baseline} />

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}

      <section aria-label="Signals" className="space-y-0">
        <h2 className="sr-only">Signals</h2>
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 px-6 py-14 text-center">
            <Zap
              className="mx-auto mb-3 size-6 text-muted-foreground"
              aria-hidden
            />
            <p className="text-[15px] font-medium text-foreground">
              No signals match these filters
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Adjust filters, include dismissed items, or add a manual signal
              from the Signals tab on an entity while ingestion is offline.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/70 bg-card/30">
            {events.map((ev) => (
              <FeedIntelligenceRow
                key={ev.id}
                orgSlug={orgSlug}
                event={ev}
                isBookmarked={bookmarkedIds.has(ev.id)}
              />
            ))}
          </div>
        )}
      </section>

      <WorkspaceFeedPagination orgSlug={orgSlug} query={query} total={total} />
    </div>
  );
}
