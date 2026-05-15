"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createEntityRelationship,
  type RelationshipActionState,
} from "@/actions/relationships";
import {
  RELATIONSHIP_TYPES,
  RELATIONSHIP_TYPE_LABEL,
} from "@/modules/relationships/constants";
import type { TrackedEntityRow } from "@/modules/entities/loaders";

export function EntityRelationshipForm({
  orgSlug,
  entity,
  peerEntities,
}: {
  orgSlug: string;
  entity: TrackedEntityRow;
  peerEntities: TrackedEntityRow[];
}) {
  const [state, action, isPending] = useActionState<
    RelationshipActionState | null,
    FormData
  >(createEntityRelationship, null);

  const options = peerEntities.filter((p) => p.id !== entity.id);

  return (
    <form action={action} className="space-y-4 rounded-lg border border-border/70 p-4">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="from_entity_id" value={entity.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="to_entity_id">Related entity</Label>
          <select
            id="to_entity_id"
            name="to_entity_id"
            required
            className="h-[38px] w-full rounded-lg border border-border bg-background px-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Select entity…
            </option>
            {options.map((peer) => (
              <option key={peer.id} value={peer.id}>
                {peer.name} ({peer.type})
              </option>
            ))}
          </select>
        </div>

        <RelationshipTypeField />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="valid_from">Valid from (optional)</Label>
          <Input id="valid_from" name="valid_from" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valid_until">Valid until (optional)</Label>
          <Input id="valid_until" name="valid_until" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          name="note"
          maxLength={500}
          placeholder="Context for this link"
        />
      </div>

      {state?.formError ? (
        <p className="text-sm text-destructive" role="alert">
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending || options.length === 0}>
        {isPending ? "Saving…" : "Add relationship"}
      </Button>
    </form>
  );
}

function RelationshipTypeField() {
  return (
    <div className="space-y-2">
      <Label htmlFor="relationship_type">Relationship</Label>
      <select
        id="relationship_type"
        name="relationship_type"
        required
        className="h-[38px] w-full rounded-lg border border-border bg-background px-3 text-sm"
        defaultValue="competes_with"
      >
        {RELATIONSHIP_TYPES.map((t) => (
          <option key={t} value={t}>
            {RELATIONSHIP_TYPE_LABEL[t]}
          </option>
        ))}
      </select>
    </div>
  );
}
