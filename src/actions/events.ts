"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getTrackedEntity } from "@/modules/entities/loaders";
import { entitySignalDetailHref } from "@/modules/events/event-url";
import {
  manualCreateEventFormSchema,
  updateSignalScoreFormSchema,
} from "@/modules/events/schemas";
import { getWorkspaceContext } from "@/modules/org/workspace-context";
import type { Json } from "@/types/database";

export type EventActionState = {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
};

function parseOptionalTimestamptz(raw: string): string | null {
  const t = raw.trim();
  if (!t) {
    return null;
  }
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

function revalidateEntitySignals(orgSlug: string, entityId: string) {
  revalidatePath(`/w/${orgSlug}/entities/${entityId}`, "layout");
}

export async function createManualIntelligenceEvent(
  _prev: EventActionState | null,
  formData: FormData,
): Promise<EventActionState | null> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return { formError: "Workspace not found or access denied." };
  }

  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();
  if (!user) {
    return { formError: "Not signed in." };
  }

  const entity = await getTrackedEntity(
    ctx.supabase,
    ctx.organization.id,
    entityId,
  );
  if (!entity) {
    return { formError: "Entity not found in this workspace." };
  }

  const parsed = manualCreateEventFormSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    implication: String(formData.get("implication") ?? ""),
    raw_content: String(formData.get("raw_content") ?? ""),
    source_url: String(formData.get("source_url") ?? ""),
    source_type: String(formData.get("source_type") ?? "manual"),
    event_type: String(formData.get("event_type") ?? ""),
    signal_score: String(formData.get("signal_score") ?? "50"),
    published_at: String(formData.get("published_at") ?? ""),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const {
    title,
    summary,
    implication,
    raw_content,
    source_url,
    source_type,
    event_type,
    signal_score,
    published_at,
  } = parsed.data;

  const publishedAtIso = parseOptionalTimestamptz(published_at);

  const { data, error } = await ctx.supabase
    .from("intelligence_events")
    .insert({
      organization_id: ctx.organization.id,
      entity_id: entityId,
      title,
      summary,
      implication: implication?.trim() ? implication.trim() : null,
      raw_content: raw_content?.trim() ? raw_content.trim() : null,
      source_url: source_url?.trim() ? source_url.trim() : null,
      source_type,
      event_type,
      signal_score,
      metadata: {} as Json,
      published_at: publishedAtIso,
    })
    .select("id")
    .single();

  if (error) {
    return { formError: error.message };
  }

  revalidateEntitySignals(orgSlug, entityId);
  redirect(entitySignalDetailHref(orgSlug, entityId, data.id));
}

export async function dismissIntelligenceEvent(formData: FormData): Promise<void> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx || !entityId || !eventId) {
    return;
  }

  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();
  if (!user) {
    return;
  }

  const { error } = await ctx.supabase
    .from("intelligence_events")
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
      dismissed_by: user.id,
    })
    .eq("id", eventId)
    .eq("entity_id", entityId)
    .eq("organization_id", ctx.organization.id);

  if (error) {
    console.error("[events:dismiss]", error.message);
    return;
  }

  revalidateEntitySignals(orgSlug, entityId);
}

export async function restoreIntelligenceEvent(formData: FormData): Promise<void> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx || !entityId || !eventId) {
    return;
  }

  const { error } = await ctx.supabase
    .from("intelligence_events")
    .update({
      is_dismissed: false,
      dismissed_at: null,
      dismissed_by: null,
    })
    .eq("id", eventId)
    .eq("entity_id", entityId)
    .eq("organization_id", ctx.organization.id);

  if (error) {
    console.error("[events:restore]", error.message);
    return;
  }

  revalidateEntitySignals(orgSlug, entityId);
}

export async function updateIntelligenceEventSignalScore(
  _prev: EventActionState | null,
  formData: FormData,
): Promise<EventActionState | null> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return { formError: "Workspace not found or access denied." };
  }

  const parsed = updateSignalScoreFormSchema.safeParse({
    signal_score: String(formData.get("signal_score") ?? ""),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await ctx.supabase
    .from("intelligence_events")
    .update({ signal_score: parsed.data.signal_score })
    .eq("id", eventId)
    .eq("entity_id", entityId)
    .eq("organization_id", ctx.organization.id);

  if (error) {
    return { formError: error.message };
  }

  revalidateEntitySignals(orgSlug, entityId);
  return null;
}

/** Manual / debug event creation: disabled in production unless explicitly enabled. */
export async function canUseManualEventTools(): Promise<boolean> {
  if (process.env.ALLOW_MANUAL_INTELLIGENCE_EVENTS === "true") {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}
