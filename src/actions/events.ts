"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { getTrackedEntity } from "@/modules/entities/loaders";
import { countIntelligenceEventsAfter } from "@/modules/events/loaders";
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

function revalidateIntelligenceSurfaces(orgSlug: string, entityId: string) {
  revalidatePath(`/w/${orgSlug}/entities/${entityId}`, "layout");
  revalidatePath(`/w/${orgSlug}/feed`);
  revalidatePath(`/w/${orgSlug}/dashboard`);
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
    metadata_json: String(formData.get("metadata_json") ?? ""),
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
    metadata_json,
  } = parsed.data;

  const publishedAtIso = parseOptionalTimestamptz(published_at ?? "");

  let metadata: Json = {};
  const metaRaw = metadata_json?.trim();
  if (metaRaw) {
    try {
      const parsedMeta = JSON.parse(metaRaw) as unknown;
      if (
        parsedMeta === null ||
        typeof parsedMeta !== "object" ||
        Array.isArray(parsedMeta)
      ) {
        return {
          fieldErrors: {
            metadata_json: ["Metadata must be a JSON object."],
          },
        };
      }
      metadata = parsedMeta as Json;
    } catch {
      return { fieldErrors: { metadata_json: ["Invalid JSON."] } };
    }
  }

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
      metadata,
      published_at: publishedAtIso,
    })
    .select("id")
    .single();

  if (error) {
    return { formError: error.message };
  }

  if (!data) {
    return { formError: "Failed to create signal." };
  }

  revalidateIntelligenceSurfaces(orgSlug, entityId);
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

  revalidateIntelligenceSurfaces(orgSlug, entityId);
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

  revalidateIntelligenceSurfaces(orgSlug, entityId);
}

const workspaceEventIdSchema = z.object({
  orgSlug: z.string().min(1),
  eventId: z.string().uuid(),
});

export async function dismissIntelligenceEventFromWorkspace(input: {
  orgSlug: string;
  eventId: string;
}): Promise<void> {
  const { orgSlug, eventId } = workspaceEventIdSchema.parse(input);
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return;
  }

  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();
  if (!user) {
    return;
  }

  const { data: row, error: selErr } = await ctx.supabase
    .from("intelligence_events")
    .select("entity_id")
    .eq("id", eventId)
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();

  if (selErr || !row) {
    console.error("[events:dismissFeed:lookup]", selErr?.message);
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
    .eq("organization_id", ctx.organization.id);

  if (error) {
    console.error("[events:dismissFeed]", error.message);
    return;
  }

  revalidateIntelligenceSurfaces(orgSlug, row.entity_id);
}

export async function restoreIntelligenceEventFromWorkspace(input: {
  orgSlug: string;
  eventId: string;
}): Promise<void> {
  const { orgSlug, eventId } = workspaceEventIdSchema.parse(input);
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return;
  }

  const { data: row, error: selErr } = await ctx.supabase
    .from("intelligence_events")
    .select("entity_id")
    .eq("id", eventId)
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();

  if (selErr || !row) {
    console.error("[events:restoreFeed:lookup]", selErr?.message);
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
    .eq("organization_id", ctx.organization.id);

  if (error) {
    console.error("[events:restoreFeed]", error.message);
    return;
  }

  revalidateIntelligenceSurfaces(orgSlug, row.entity_id);
}

export async function getWorkspaceFeedFreshEventCount(
  orgSlug: string,
  afterIso: string,
): Promise<number> {
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return 0;
  }
  return countIntelligenceEventsAfter(
    ctx.supabase,
    ctx.organization.id,
    afterIso,
  );
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

  revalidateIntelligenceSurfaces(orgSlug, entityId);
  return null;
}

/** Manual / debug event creation: disabled in production unless explicitly enabled. */
export async function canUseManualEventTools(): Promise<boolean> {
  if (process.env.ALLOW_MANUAL_INTELLIGENCE_EVENTS === "true") {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}
