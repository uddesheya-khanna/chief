import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/primitives/page-header";
import { Surface } from "@/components/primitives/surface";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EntityForm } from "@/modules/entities/components/entity-form";
import { entityDetailHref } from "@/modules/entities/entity-url";
import { getTrackedEntity } from "@/modules/entities/loaders";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function EditEntityPage({
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
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title={`Edit · ${entity.name}`}
        description="Changes apply immediately to this workspace. Archived entities remain queryable for lineage."
      >
        <Link
          href={entityDetailHref(orgSlug, entity.id)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "no-underline",
          )}
        >
          Cancel
        </Link>
      </PageHeader>
      <Surface variant="inset" className="p-6 sm:p-8">
        <EntityForm mode="edit" orgSlug={orgSlug} entity={entity} />
      </Surface>
    </div>
  );
}
