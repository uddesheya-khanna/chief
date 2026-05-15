"use client";

import { useActionState } from "react";

import {
  triggerEntityIngestion,
  type IngestionActionState,
} from "@/actions/ingestion";
import { Button } from "@/components/ui/button";
import type { IngestionSourceType } from "@/lib/ingestion/types";

export function IngestionRunForm({
  orgSlug,
  entityId,
  sourceType,
  label,
}: {
  orgSlug: string;
  entityId: string;
  sourceType: IngestionSourceType;
  label: string;
}) {
  const [state, action, pending] = useActionState<
    IngestionActionState | null,
    FormData
  >(triggerEntityIngestion, null);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="entityId" value={entityId} />
      <input type="hidden" name="sourceType" value={sourceType} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Crawling…" : label}
      </Button>
      {state?.formError ? (
        <p className="text-xs text-destructive" role="alert">
          {state.formError}
        </p>
      ) : null}
      {state?.ok && state.resultType ? (
        <p className="text-xs text-muted-foreground" role="status">
          Last run: {state.resultType.replace(/_/g, " ")}
          {state.eventId ? " — new signal created" : ""}
        </p>
      ) : null}
    </form>
  );
}
