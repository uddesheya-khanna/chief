"use client";

import { useActionState } from "react";

import {
  createManualIntelligenceEvent,
  type EventActionState,
} from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABEL,
  SOURCE_TYPES,
  SOURCE_TYPE_LABEL,
} from "@/modules/events/constants";

export function ManualEventForm({
  orgSlug,
  entityId,
}: {
  orgSlug: string;
  entityId: string;
}) {
  const [state, formAction, pending] = useActionState<
    EventActionState | null,
    FormData
  >(createManualIntelligenceEvent, null);

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-8">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="entityId" value={entityId} />

      {state?.formError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.formError}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required maxLength={200} />
          {state?.fieldErrors?.title ? (
            <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_type">Event type</Label>
          <select
            id="event_type"
            name="event_type"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            defaultValue="other"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.event_type ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.event_type[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="source_type">Source type</Label>
          <select
            id="source_type"
            name="source_type"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            defaultValue="manual"
          >
            {SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {SOURCE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.source_type ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.source_type[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signal_score">Signal score (0–100)</Label>
          <Input
            id="signal_score"
            name="signal_score"
            type="number"
            min={0}
            max={100}
            defaultValue={72}
            className="font-mono tabular-nums"
          />
          {state?.fieldErrors?.signal_score ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.signal_score[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="published_at">Published at (optional)</Label>
          <Input id="published_at" name="published_at" type="datetime-local" />
          {state?.fieldErrors?.published_at ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.published_at[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="source_url">Source URL (optional)</Label>
          <Input id="source_url" name="source_url" type="url" placeholder="https://…" />
          {state?.fieldErrors?.source_url ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.source_url[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea id="summary" name="summary" rows={5} required className="min-h-[120px] resize-y" />
          {state?.fieldErrors?.summary ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.summary[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="implication">Implication (optional)</Label>
          <Textarea
            id="implication"
            name="implication"
            rows={3}
            className="min-h-[80px] resize-y"
          />
          {state?.fieldErrors?.implication ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.implication[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="raw_content">Raw excerpt (optional)</Label>
          <Textarea
            id="raw_content"
            name="raw_content"
            rows={4}
            className="min-h-[96px] resize-y font-mono text-[13px]"
          />
          {state?.fieldErrors?.raw_content ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.raw_content[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end border-t border-border/60 pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create signal"}
        </Button>
      </div>
    </form>
  );
}
