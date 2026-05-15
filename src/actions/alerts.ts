"use server";

import { revalidatePath } from "next/cache";

import { getWorkspaceContext } from "@/modules/org/workspace-context";

export async function markAlertRead(formData: FormData): Promise<void> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const alertId = String(formData.get("alertId") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx || !alertId) {
    return;
  }

  await ctx.supabase
    .from("intelligence_alerts")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .eq("organization_id", ctx.organization.id);

  revalidatePath(`/w/${orgSlug}/alerts`);
  revalidatePath(`/w/${orgSlug}`, "layout");
}

export async function markAllAlertsRead(formData: FormData): Promise<void> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return;
  }

  await ctx.supabase
    .from("intelligence_alerts")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("organization_id", ctx.organization.id)
    .eq("is_read", false);

  revalidatePath(`/w/${orgSlug}/alerts`);
  revalidatePath(`/w/${orgSlug}`, "layout");
}
