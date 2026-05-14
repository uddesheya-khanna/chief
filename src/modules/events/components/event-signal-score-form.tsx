"use client";

import { useActionState } from "react";

import {
  updateIntelligenceEventSignalScore,
  type EventActionState,
} from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EventSignalScoreForm({
  orgSlug,
  entityId,
  eventId,
  initialScore,
}: {
  orgSlug: string;
  entityId: string;
  eventId: string;
  initialScore: number;
}) {
  const [state, formAction, pending] = useActionState<
    EventActionState | null,
    FormData
  >(updateIntelligenceEventSignalScore, null);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="entityId" value={entityId} />
      <input type="hidden" name="eventId" value={eventId} />
      <div className="space-y-2">
        <Label htmlFor={`signal_score_${eventId}`}>Score (0–100)</Label>
        <Input
          id={`signal_score_${eventId}`}
          name="signal_score"
          type="number"
          min={0}
          max={100}
          step={1}
          defaultValue={initialScore}
          className="h-9 font-mono tabular-nums"
        />
        {state?.fieldErrors?.signal_score ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.signal_score[0]}
          </p>
        ) : null}
        {state?.formError ? (
          <p className="text-xs text-destructive">{state.formError}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending} className="sm:mb-0.5">
        {pending ? "Saving…" : "Update score"}
      </Button>
    </form>
  );
}
