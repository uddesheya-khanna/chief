import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { canUseManualEventTools } from "@/actions/events";
import { PageHeader } from "@/components/primitives/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTrackedEntity } from "@/modules/entities/loaders";
import { ManualEventForm } from "@/modules/events/components/manual-event-form";
import { entitySignalsHref } from "@/modules/events/event-url";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function ManualSignalNewPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  const manualEnabled = await canUseManualEventTools();
  if (!manualEnabled) {
    redirect(entitySignalsHref(orgSlug, id));
  }

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
      <PageHeader
        title="Add manual signal"
        description={`Create a seeded intelligence event for ${entity.name}. Use realistic titles and summaries so downstream feed and briefing work stays representative.`}
      >
        <Link
          href={entitySignalsHref(orgSlug, id)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Cancel
        </Link>
      </PageHeader>

      <ManualEventForm orgSlug={orgSlug} entityId={id} />
    </div>
  );
}
