import { notFound } from "next/navigation";

import { PageHeader } from "@/components/primitives/page-header";
import { MonitoringRulesPanel } from "@/modules/monitoring/components/monitoring-rules-panel";
import { listMonitoringRules } from "@/modules/monitoring/loaders";
import { listTrackedEntities } from "@/modules/entities/loaders";
import { parseEntityListQuery } from "@/modules/entities/search-params";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function MonitoringPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    notFound();
  }

  const [rules, entities] = await Promise.all([
    listMonitoringRules(ctx.supabase, ctx.organization.id),
    listTrackedEntities(
      ctx.supabase,
      ctx.organization.id,
      parseEntityListQuery({ status: "active" }),
    ),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Monitoring"
        description="Define deterministic rules for when intelligence should surface as alerts. Every match is explainable."
      />
      <MonitoringRulesPanel orgSlug={orgSlug} rules={rules} entities={entities} />
    </div>
  );
}
