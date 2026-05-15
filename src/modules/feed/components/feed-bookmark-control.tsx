import { Bookmark } from "lucide-react";

import { toggleBookmarkEvent } from "@/actions/workflow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FeedBookmarkControl({
  orgSlug,
  eventId,
  isBookmarked,
}: {
  orgSlug: string;
  eventId: string;
  isBookmarked: boolean;
}) {
  return (
    <form action={toggleBookmarkEvent}>
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="eventId" value={eventId} />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className={cn("size-8", isBookmarked && "text-foreground")}
        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark signal"}
      >
        <Bookmark
          className={cn("size-4", isBookmarked && "fill-current")}
          aria-hidden
        />
      </Button>
    </form>
  );
}
