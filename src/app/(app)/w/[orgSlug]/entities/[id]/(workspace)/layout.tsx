import { notFound } from "next/navigation";

import { EntityWorkspaceShell } from "@/modules/entities/components/entity-workspace-shell";
import { getTrackedEntity } from "@/modules/entities/loaders";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return { title: "Entity" };
  }
  const entity = await getTrackedEntity(ctx.supabase, ctx.organization.id, id);
  if (!entity) {
    return { title: "Entity" };
  }
  return { title: `${entity.name} · Chief` };
}

export default async function EntityWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
    <EntityWorkspaceShell orgSlug={orgSlug} entity={entity}>
      {children}
    </EntityWorkspaceShell>
  );
}
