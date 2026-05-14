import Link from "next/link";
import { Plus } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { PageHeader } from "@/components/primitives/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EntityEmptyState } from "@/modules/entities/components/entity-empty-state";
import { EntityFilterBar } from "@/modules/entities/components/entity-filter-bar";
import { EntitiesTable } from "@/modules/entities/components/entities-table";
import type { EntityType } from "@/modules/entities/constants";
import { entityNewHref } from "@/modules/entities/entity-url";
import { listTrackedEntities } from "@/modules/entities/loaders";
import type { EntityListQuery } from "@/modules/entities/schemas";
import type { Database } from "@/types/database";

type EntityListScreenProps = {
  supabase: SupabaseClient<Database>;
  orgSlug: string;
  organizationId: string;
  listSegment: string;
  listQuery: EntityListQuery;
  lockedType?: EntityType;
  title: string;
  description: string;
};

export async function EntityListScreen({
  supabase,
  orgSlug,
  organizationId,
  listSegment,
  listQuery,
  lockedType,
  title,
  description,
}: EntityListScreenProps) {
  const effective: EntityListQuery = lockedType
    ? { ...listQuery, type: lockedType }
    : listQuery;

  const rows = await listTrackedEntities(supabase, organizationId, effective);

  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description}>
        <Link
          href={entityNewHref(orgSlug, lockedType)}
          className={cn(
            buttonVariants({ size: "sm" }),
            "inline-flex shrink-0 items-center gap-1.5",
          )}
        >
          <Plus className="size-4" />
          Add entity
        </Link>
      </PageHeader>

      <EntityFilterBar
        orgSlug={orgSlug}
        listSegment={listSegment}
        query={listQuery}
        lockedType={lockedType}
      />

      {rows.length === 0 ? (
        <EntityEmptyState orgSlug={orgSlug} lockedType={lockedType} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
          <EntitiesTable orgSlug={orgSlug} rows={rows} />
        </div>
      )}
    </div>
  );
}
