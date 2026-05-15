"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { EVENT_TYPES, SOURCE_TYPES } from "@/modules/events/constants";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

const createRuleSchema = z.object({
  name: z.string().min(1).max(120),
  entity_id: z.string().uuid().optional().or(z.literal("")),
  min_signal_score: z.coerce.number().int().min(0).max(100).default(75),
  event_types: z.string().optional(),
  source_types: z.string().optional(),
  recency_hours: z.coerce.number().int().positive().default(168),
});

export type MonitoringRuleActionState = {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
};

function parseCsvTypes<T extends readonly string[]>(
  raw: string | undefined,
  allowed: T,
): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T[number] => (allowed as readonly string[]).includes(s));
}

export async function createMonitoringRule(
  _prev: MonitoringRuleActionState | null,
  formData: FormData,
): Promise<MonitoringRuleActionState | null> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return { formError: "Workspace not found." };
  }

  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();
  if (!user) {
    return { formError: "Not signed in." };
  }

  const parsed = createRuleSchema.safeParse({
    name: formData.get("name"),
    entity_id: formData.get("entity_id"),
    min_signal_score: formData.get("min_signal_score"),
    event_types: formData.get("event_types"),
    source_types: formData.get("source_types"),
    recency_hours: formData.get("recency_hours"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const entityId = parsed.data.entity_id?.trim() || null;

  const { error } = await ctx.supabase.from("monitoring_rules").insert({
    organization_id: ctx.organization.id,
    entity_id: entityId,
    name: parsed.data.name,
    min_signal_score: parsed.data.min_signal_score,
    event_types: parseCsvTypes(parsed.data.event_types, EVENT_TYPES),
    source_types: parseCsvTypes(parsed.data.source_types, SOURCE_TYPES),
    recency_hours: parsed.data.recency_hours,
    created_by: user.id,
  });

  if (error) {
    return { formError: error.message };
  }

  revalidatePath(`/w/${orgSlug}/monitoring`);
  revalidatePath(`/w/${orgSlug}/settings`);
  return null;
}

export async function toggleMonitoringRule(formData: FormData): Promise<void> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const ruleId = String(formData.get("ruleId") ?? "");
  const isActive = formData.get("is_active") === "1";
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx || !ruleId) {
    return;
  }

  await ctx.supabase
    .from("monitoring_rules")
    .update({ is_active: isActive })
    .eq("id", ruleId)
    .eq("organization_id", ctx.organization.id);

  revalidatePath(`/w/${orgSlug}/monitoring`);
}

export async function deleteMonitoringRule(formData: FormData): Promise<void> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const ruleId = String(formData.get("ruleId") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx || !ruleId) {
    return;
  }

  await ctx.supabase
    .from("monitoring_rules")
    .delete()
    .eq("id", ruleId)
    .eq("organization_id", ctx.organization.id);

  revalidatePath(`/w/${orgSlug}/monitoring`);
}
