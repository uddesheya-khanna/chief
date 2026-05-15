import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/primitives/page-header";
import { DigestGenerateForm } from "@/modules/digests/components/digest-generate-form";
import { listDigests } from "@/modules/digests/loaders";
import { getWorkspaceContext } from "@/modules/org/workspace-context";
import { workspaceHref } from "@/modules/shell/nav";

export default async function DigestsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    notFound();
  }

  const digests = await listDigests(ctx.supabase, ctx.organization.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Intelligence digests"
        description="Executive summaries generated from your retrieval layer — daily, weekly, and thematic roundups."
      />
      <DigestGenerateForm orgSlug={orgSlug} />
      {digests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 px-6 py-12 text-center text-sm text-muted-foreground">
          No digests yet. Generate one from Monitoring or wait for scheduled
          delivery.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border/70">
          {digests.map((d) => (
            <li key={d.id}>
              <Link
                href={workspaceHref(orgSlug, `/digests/${d.id}`)}
                className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/25"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {d.digest_type.replace(/_/g, " ")} ·{" "}
                    {d.period_start.slice(0, 10)} — {d.period_end.slice(0, 10)}
                  </p>
                </div>
                <span className="text-[12px] text-muted-foreground">
                  {new Date(d.created_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
