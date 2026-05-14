"use client";

import type { IntelligenceEventRow } from "@/modules/events/loaders";
import { dismissIntelligenceEvent, restoreIntelligenceEvent } from "@/actions/events";
import { Button } from "@/components/ui/button";

export function EventDetailActions({
  orgSlug,
  entityId,
  event,
}: {
  orgSlug: string;
  entityId: string;
  event: IntelligenceEventRow;
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {event.is_dismissed ? (
        <form action={restoreIntelligenceEvent}>
          <input type="hidden" name="orgSlug" value={orgSlug} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="eventId" value={event.id} />
          <Button type="submit" variant="outline" size="sm">
            Restore to feed
          </Button>
        </form>
      ) : (
        <form action={dismissIntelligenceEvent}>
          <input type="hidden" name="orgSlug" value={orgSlug} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="eventId" value={event.id} />
          <Button type="submit" variant="outline" size="sm">
            Dismiss
          </Button>
        </form>
      )}
    </div>
  );
}
