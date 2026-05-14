import Link from "next/link";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/primitives/surface";
import { cn } from "@/lib/utils";
import { entityNewHref } from "@/modules/entities/entity-url";
import type { EntityType } from "@/modules/entities/constants";
import { ENTITY_TYPE_LABEL_PLURAL } from "@/modules/entities/constants";

export function EntityEmptyState({
  orgSlug,
  lockedType,
}: {
  orgSlug: string;
  lockedType?: EntityType;
}) {
  const title = lockedType
    ? `No ${ENTITY_TYPE_LABEL_PLURAL[lockedType].toLowerCase()} yet`
    : "No tracked entities yet";

  const body = lockedType
    ? `Add ${ENTITY_TYPE_LABEL_PLURAL[lockedType].toLowerCase().slice(0, -1)} organizations you want the workspace to monitor. You can refine metadata and context on each record.`
    : "Start by adding competitors, investors, partners, or market entities. Each record stays scoped to this workspace with full audit context.";

  return (
    <Surface variant="muted" className="border-dashed py-14 text-center">
      <p className="font-heading text-lg font-medium tracking-tight text-foreground">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      <Link
        href={entityNewHref(orgSlug, lockedType)}
        className={cn(
          buttonVariants({ size: "sm" }),
          "mt-6 inline-flex items-center gap-1.5",
        )}
      >
        <Plus className="size-4" />
        Add entity
      </Link>
    </Surface>
  );
}
