"use client";

import { useActionState } from "react";

import { generateDigest, type DigestActionState } from "@/actions/digests";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function DigestGenerateForm({ orgSlug }: { orgSlug: string }) {
  const [state, action, isPending] = useActionState<
    DigestActionState | null,
    FormData
  >(generateDigest, null);

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border/70 p-4"
    >
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <div className="space-y-2">
        <Label htmlFor="digestKind">Generate digest</Label>
        <select
          id="digestKind"
          name="digestKind"
          className="h-[38px] rounded-lg border border-border bg-background px-3 text-sm"
          defaultValue="daily"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly strategic</option>
          <option value="high_signal">High-signal roundup</option>
          <option value="competitor_watch">Competitor watch</option>
        </select>
      </div>
      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Generating…" : "Generate"}
      </Button>
      {state?.formError ? (
        <p className="w-full text-sm text-destructive" role="alert">
          {state.formError}
        </p>
      ) : null}
      {state?.digestId ? (
        <p className="w-full text-sm text-muted-foreground">
          Digest created. Refresh the list to open it.
        </p>
      ) : null}
    </form>
  );
}
