import Link from "next/link";

import { submitWorkflowCollection } from "@/actions/workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ENTITY_TYPE_LABEL,
  isEntityType,
} from "@/modules/entities/constants";
import type { TrackedEntityRow } from "@/modules/entities/loaders";
import { entitySignalDetailHref } from "@/modules/events/event-url";
import type { FeedEventWithEntity } from "@/modules/events/loaders";
import { workspaceHref } from "@/modules/shell/nav";
import type { Database } from "@/types/database";

type CollectionRow =
  Database["public"]["Tables"]["workflow_collections"]["Row"];

export function WatchWorkspacePanel({
  orgSlug,
  collections,
  bookmarkedEvents,
  pinnedEntities,
}: {
  orgSlug: string;
  collections: CollectionRow[];
  bookmarkedEvents: FeedEventWithEntity[];
  pinnedEntities: TrackedEntityRow[];
}) {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Bookmarked signals
        </h2>
        {bookmarkedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bookmarked events. Save signals from the feed as you review them.
          </p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/70">
            {bookmarkedEvents.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={entitySignalDetailHref(
                    orgSlug,
                    ev.entity_id,
                    ev.id,
                  )}
                  className="block px-4 py-3 transition-colors hover:bg-muted/25"
                >
                  <p className="text-sm font-medium text-foreground">
                    {ev.title}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {ev.tracked_entities?.name ?? "Entity"} · score{" "}
                    {ev.signal_score}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Pinned entities
        </h2>
        {pinnedEntities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Pin entities from their workspace pages for quick access here.
          </p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/70">
            {pinnedEntities.map((e) => (
              <li key={e.id}>
                <Link
                  href={workspaceHref(orgSlug, `/entities/${e.id}`)}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/25"
                >
                  <span className="text-sm font-medium text-foreground">
                    {e.name}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {isEntityType(e.type) ? ENTITY_TYPE_LABEL[e.type] : e.type}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Collections
        </h2>
        {collections.length > 0 ? (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/70">
            {collections.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-[12px] text-muted-foreground">
                  {c.collection_type.replace(/_/g, " ")}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        <form
          action={submitWorkflowCollection}
          className="space-y-3 rounded-lg border border-border/70 p-4"
        >
          <input type="hidden" name="orgSlug" value={orgSlug} />
          <input type="hidden" name="collection_type" value="watchlist" />
          <CollectionFields />
          <Button type="submit" size="sm">
            Create collection
          </Button>
        </form>
      </section>
    </div>
  );
}

function CollectionFields() {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="watch-name">Name</Label>
        <Input id="watch-name" name="name" required placeholder="Q2 competitor watch" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="watch-desc">Description (optional)</Label>
        <Input id="watch-desc" name="description" placeholder="Board prep shortlist" />
      </div>
    </>
  );
}
