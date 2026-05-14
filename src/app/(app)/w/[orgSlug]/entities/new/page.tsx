import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/primitives/page-header";
import { Surface } from "@/components/primitives/surface";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EntityForm } from "@/modules/entities/components/entity-form";
import { isEntityType, type EntityType } from "@/modules/entities/constants";
import { getWorkspaceContext } from "@/modules/org/workspace-context";
import { workspaceHref } from "@/modules/shell/nav";

function first(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function NewEntityPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    notFound();
  }

  const t = first((await searchParams).type);
  const defaultType: EntityType | undefined =
    t && isEntityType(t) ? t : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Add entity"
        description="Capture the essentials now. Rich intelligence layers attach to these records later."
      >
        <Link
          href={workspaceHref(orgSlug, "/entities")}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "no-underline",
          )}
        >
          Back to directory
        </Link>
      </PageHeader>
      <Surface variant="inset" className="p-6 sm:p-8">
        <EntityForm mode="create" orgSlug={orgSlug} defaultType={defaultType} />
      </Surface>
    </div>
  );
}
