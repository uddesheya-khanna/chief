"use server";

import { revalidatePath } from "next/cache";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { getWorkspaceContext } from "@/modules/org/workspace-context";
import type { Database } from "@/types/database";

export type WorkflowActionState = { formError?: string };

const collectionSchema = z.object({
  name: z.string().min(1).max(120),
  collection_type: z.enum(["bookmarks", "watchlist", "investigation"]),
  description: z.string().max(500).optional(),
});

export async function submitWorkflowCollection(
  formData: FormData,
): Promise<void> {
  await createWorkflowCollection(null, formData);
}

export async function createWorkflowCollection(
  _prev: WorkflowActionState | null,
  formData: FormData,
): Promise<WorkflowActionState | null> {
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

  const parsed = collectionSchema.safeParse({
    name: formData.get("name"),
    collection_type: formData.get("collection_type"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { formError: "Invalid collection details." };
  }

  const { error } = await ctx.supabase.from("workflow_collections").insert({
    organization_id: ctx.organization.id,
    user_id: user.id,
    name: parsed.data.name,
    collection_type: parsed.data.collection_type,
    description: parsed.data.description?.trim() || null,
  });

  if (error) {
    return { formError: error.message };
  }

  revalidatePath(`/w/${orgSlug}/watch`);
  return null;
}

export async function toggleBookmarkEvent(formData: FormData): Promise<void> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx || !eventId) {
    return;
  }

  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();
  if (!user) {
    return;
  }

  const collectionId = await ensureBookmarksCollection(
    ctx.supabase,
    ctx.organization.id,
    user.id,
    parsedCollectionName("Saved signals"),
  );

  if (!collectionId) {
    return;
  }

  const { data: existing } = await ctx.supabase
    .from("workflow_collection_items")
    .select("id")
    .eq("collection_id", collectionId)
    .eq("item_type", "event")
    .eq("item_id", eventId)
    .maybeSingle();

  if (existing) {
    await ctx.supabase
      .from("workflow_collection_items")
      .delete()
      .eq("id", existing.id);
  } else {
    await ctx.supabase.from("workflow_collection_items").insert({
      organization_id: ctx.organization.id,
      collection_id: collectionId,
      item_type: "event",
      item_id: eventId,
    });
  }

  revalidatePath(`/w/${orgSlug}/feed`);
  revalidatePath(`/w/${orgSlug}/watch`);
}

export async function togglePinEntity(formData: FormData): Promise<void> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx || !entityId) {
    return;
  }

  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();
  if (!user) {
    return;
  }

  const { data: existing } = await ctx.supabase
    .from("pinned_entities")
    .select("entity_id")
    .eq("organization_id", ctx.organization.id)
    .eq("user_id", user.id)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (existing) {
    await ctx.supabase
      .from("pinned_entities")
      .delete()
      .eq("organization_id", ctx.organization.id)
      .eq("user_id", user.id)
      .eq("entity_id", entityId);
  } else {
    await ctx.supabase.from("pinned_entities").insert({
      organization_id: ctx.organization.id,
      user_id: user.id,
      entity_id: entityId,
    });
  }

  revalidatePath(`/w/${orgSlug}/entities/${entityId}`, "layout");
  revalidatePath(`/w/${orgSlug}/watch`);
}

function parsedCollectionName(name: string) {
  return name;
}

async function ensureBookmarksCollection(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  userId: string,
  name: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("workflow_collections")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("collection_type", "bookmarks")
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("workflow_collections")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      name,
      collection_type: "bookmarks",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[workflow:bookmarks]", error.message);
    return null;
  }

  return data?.id ?? null;
}
