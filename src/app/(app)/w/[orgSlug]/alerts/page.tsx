import { notFound } from "next/navigation";

import { PageHeader } from "@/components/primitives/page-header";
import { AlertsCenter } from "@/modules/alerts/components/alerts-center";
import { listAlerts } from "@/modules/alerts/loaders";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function AlertsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    notFound();
  }

  const alerts = await listAlerts(ctx.supabase, ctx.organization.id, {
    limit: 80,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Alerts"
        description="Prioritized intelligence delivery from monitoring rules and high-signal defaults. Grouped by day, explainable, and actionable."
      />
      <AlertsCenter orgSlug={orgSlug} alerts={alerts} />
    </div>
  );
}
