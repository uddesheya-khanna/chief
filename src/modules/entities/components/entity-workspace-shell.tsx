import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import {
  EntityDetailFooterNav,
  EntityDetailHeader,
} from "@/modules/entities/components/entity-detail-view";
import { EntityDetailTabNav } from "@/modules/entities/components/entity-detail-tab-nav";
import type { TrackedEntityRow } from "@/modules/entities/loaders";

export function EntityWorkspaceShell({
  orgSlug,
  entity,
  children,
}: {
  orgSlug: string;
  entity: TrackedEntityRow;
  children: ReactNode;
}) {
  return (
    <div className="space-y-10">
      <EntityDetailHeader orgSlug={orgSlug} entity={entity} />
      <EntityDetailTabNav orgSlug={orgSlug} entityId={entity.id} />
      <div className="min-h-[12rem]">{children}</div>
      <Separator className="opacity-60" />
      <EntityDetailFooterNav orgSlug={orgSlug} entity={entity} />
    </div>
  );
}
