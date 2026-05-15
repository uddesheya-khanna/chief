import { dismissIntelligenceEvent, restoreIntelligenceEvent } from "@/actions/events";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IntelligenceEventRow } from "@/modules/events/loaders";

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
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Restore to feed
          </button>
        </form>
      ) : (
        <form action={dismissIntelligenceEvent}>
          <input type="hidden" name="orgSlug" value={orgSlug} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="eventId" value={event.id} />
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Dismiss
          </button>
        </form>
      )}
    </div>
  );
}
