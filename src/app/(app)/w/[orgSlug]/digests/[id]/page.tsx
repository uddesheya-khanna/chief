import { notFound } from "next/navigation";

import { DigestReader } from "@/modules/digests/components/digest-reader";
import { getDigest } from "@/modules/digests/loaders";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export default async function DigestDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    notFound();
  }

  const digest = await getDigest(ctx.supabase, ctx.organization.id, id);
  if (!digest) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <DigestReader orgSlug={orgSlug} digest={digest} />
    </div>
  );
}
