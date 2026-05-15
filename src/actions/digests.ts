"use server";

import { revalidatePath } from "next/cache";

import {
  runCompetitorWatchDigest,
  runDailyDigestForOrganization,
  runHighSignalRoundup,
  runWeeklyDigestForOrganization,
} from "@/jobs/digests";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export type DigestActionState = { formError?: string; digestId?: string };

export async function generateDigest(
  _prev: DigestActionState | null,
  formData: FormData,
): Promise<DigestActionState | null> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const digestKind = String(formData.get("digestKind") ?? "daily");

  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return { formError: "Workspace not found." };
  }

  const workspaceName = ctx.organization.name;
  const orgId = ctx.organization.id;

  let result: { digestId?: string; error?: string };
  switch (digestKind) {
    case "weekly":
      result = await runWeeklyDigestForOrganization(orgId, workspaceName);
      break;
    case "high_signal":
      result = await runHighSignalRoundup(orgId, workspaceName);
      break;
    case "competitor_watch":
      result = await runCompetitorWatchDigest(orgId, workspaceName);
      break;
    case "daily":
    default:
      result = await runDailyDigestForOrganization(orgId, workspaceName);
      break;
  }

  if (result.error) {
    return { formError: result.error };
  }

  revalidatePath(`/w/${orgSlug}/digests`);
  revalidatePath(`/w/${orgSlug}/dashboard`);

  return { digestId: result.digestId };
}
