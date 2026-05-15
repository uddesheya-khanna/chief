"use client";

import { useActionState } from "react";

import { createMonitoringRule } from "@/actions/monitoring-rules";
import type { MonitoringRuleActionState } from "@/actions/monitoring-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TrackedEntityRow } from "@/modules/entities/loaders";

export function MonitoringRuleForm({
  orgSlug,
  entities,
}: {
  orgSlug: string;
  entities: TrackedEntityRow[];
}) {
  const [state, action, isPending] = useActionState<
    MonitoringRuleActionState | null,
    FormData
  >(createMonitoringRule, null);

  return (
    <form
      action={action}
      className="space-y-4 rounded-lg border border-border/70 p-4"
    >
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <div className="space-y-2">
        <Label htmlFor="name">Rule name</Label>
        <Input id="name" name="name" required placeholder="High-signal competitors" />
      </div>
      <RuleEntitySelect entities={entities} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="min_signal_score">Min signal score</Label>
          <Input
            id="min_signal_score"
            name="min_signal_score"
            type="number"
            min={0}
            max={100}
            defaultValue={75}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recency_hours">Recency (hours)</Label>
          <Input
            id="recency_hours"
            name="recency_hours"
            type="number"
            min={1}
            defaultValue={168}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="event_types">Event types (comma-separated, optional)</Label>
        <Input
          id="event_types"
          name="event_types"
          placeholder="pricing_change,funding"
        />
      </div>
      {state?.formError ? (
        <p className="text-sm text-destructive" role="alert">
          {state.formError}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create rule"}
      </Button>
    </form>
  );
}

function RuleEntitySelect({ entities }: { entities: TrackedEntityRow[] }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="entity_id">Entity scope</Label>
      <select
        id="entity_id"
        name="entity_id"
        className="h-[38px] w-full rounded-lg border border-border bg-background px-3 text-sm"
        defaultValue=""
      >
        <option value="">All entities</option>
        {entities.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
    </div>
  );
}
