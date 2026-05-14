import { notFound } from "next/navigation";

import { EntityListScreen } from "@/modules/entities/components/entity-list-screen";
import { parseEntityListQuery } from "@/modules/entities/search-params";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function PartnersPage({
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

  return (
    <EntityListScreen
      supabase={ctx.supabase}
      orgSlug={orgSlug}
      organizationId={ctx.organization.id}
      listSegment="partners"
      listQuery={parseEntityListQuery(await searchParams)}
      lockedType="partner"
      title="Partners"
      description="Technology partners, channel allies, and co-sell relationships that shape your ecosystem motion."
    />
  );
}
