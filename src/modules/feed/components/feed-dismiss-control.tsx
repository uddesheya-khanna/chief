"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  dismissIntelligenceEventFromWorkspace,
  restoreIntelligenceEventFromWorkspace,
} from "@/actions/events";
import { Button } from "@/components/ui/button";

export function FeedDismissControl({
  orgSlug,
  eventId,
}: {
  orgSlug: string;
  eventId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await dismissIntelligenceEventFromWorkspace({ orgSlug, eventId });
          toast.message("Signal dismissed", {
            description: "Removed from the active feed.",
            action: {
              label: "Undo",
              onClick: () => {
                void (async () => {
                  await restoreIntelligenceEventFromWorkspace({
                    orgSlug,
                    eventId,
                  });
                  toast.message("Signal restored");
                  router.refresh();
                })();
              },
            },
          });
          router.refresh();
        });
      }}
    >
      {pending ? "…" : "Dismiss"}
    </Button>
  );
}
