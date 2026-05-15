import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteEntityRelationship } from "@/actions/relationships";
import { RELATIONSHIP_TYPE_LABEL } from "@/modules/relationships/constants";
import type { EntityRelationshipRow } from "@/modules/relationships/loaders";
import type { TrackedEntityRow } from "@/modules/entities/loaders";
import { EntityRelationshipForm } from "@/modules/relationships/components/entity-relationship-form";

export function EntityRelationshipsPanel({
  orgSlug,
  entity,
  relationships,
  peerEntities,
}: {
  orgSlug: string;
  entity: TrackedEntityRow;
  relationships: EntityRelationshipRow[];
  peerEntities: TrackedEntityRow[];
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Relationships
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Lightweight links between tracked entities — competitors, investors,
          partners, and market context. Timeline-aware metadata only; no graph
          visualization.
        </p>
      </div>

      <EntityRelationshipForm
        orgSlug={orgSlug}
        entity={entity}
        peerEntities={peerEntities}
      />

      {relationships.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
          No relationships defined for {entity.name} yet.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border/70">
          {relationships.map((rel) => {
            const isFrom = rel.from_entity_id === entity.id;
            const peer = isFrom ? rel.to_entity : rel.from_entity;
            const peerId = isFrom ? rel.to_entity_id : rel.from_entity_id;
            const label =
              RELATIONSHIP_TYPE_LABEL[
                rel.relationship_type as keyof typeof RELATIONSHIP_TYPE_LABEL
              ] ?? rel.relationship_type;

            return (
              <li
                key={rel.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <span className="text-muted-foreground">{label}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                {peer ? (
                  <Link
                    href={`/w/${orgSlug}/entities/${peerId}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {peer.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Unknown entity</span>
                )}
                {rel.valid_from || rel.valid_until ? (
                  <span className="text-[12px] text-muted-foreground">
                    {rel.valid_from
                      ? new Date(rel.valid_from).toLocaleDateString()
                      : "—"}
                    {" → "}
                    {rel.valid_until
                      ? new Date(rel.valid_until).toLocaleDateString()
                      : "present"}
                  </span>
                ) : null}
                <form
                  action={deleteEntityRelationship}
                  className="ml-auto"
                >
                  <input type="hidden" name="orgSlug" value={orgSlug} />
                  <input type="hidden" name="relationshipId" value={rel.id} />
                  <input type="hidden" name="entityId" value={entity.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label="Remove relationship"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
