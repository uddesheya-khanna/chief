import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EntityReferencePanel } from "@/modules/entities/components/entity-detail-view";
import { entityEditHref } from "@/modules/entities/entity-url";
import { getTrackedEntity } from "@/modules/entities/loaders";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function EntitySettingsTabPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    notFound();
  }

  const entity = await getTrackedEntity(ctx.supabase, ctx.organization.id, id);
  if (!entity) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Reference data and status for this tracked entity. Profile edits use
          the full editor.
        </p>
        <Link
          href={entityEditHref(orgSlug, id)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex w-fit",
          )}
        >
          Open profile editor
        </Link>
      </div>
      <EntityReferencePanel entity={entity} />
    </div>
  );
}
