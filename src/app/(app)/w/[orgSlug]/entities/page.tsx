import { notFound } from "next/navigation";

import { EntityListScreen } from "@/modules/entities/components/entity-list-screen";
import { parseEntityListQuery } from "@/modules/entities/search-params";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function EntitiesDirectoryPage({
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

  const listQuery = parseEntityListQuery(await searchParams);

  return (
    <EntityListScreen
      supabase={ctx.supabase}
      orgSlug={orgSlug}
      organizationId={ctx.organization.id}
      listSegment="entities"
      listQuery={listQuery}
      title="Entity directory"
      description="A single source of truth for who you track across the competitive landscape, capital markets, partnerships, and macro context."
    />
  );
}
