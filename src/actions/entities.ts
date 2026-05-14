"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createEntitySchema,
  entityMetadataSchema,
  updateEntityFormSchema,
} from "@/modules/entities/schemas";
import { getWorkspaceContext } from "@/modules/org/workspace-context";
import type { Json } from "@/types/database";

export type EntityActionState = {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
};

function stripEmptyMetadata(
  raw: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" && v.trim()) {
      out[k] = v.trim();
    }
  }
  return out;
}

function formMeta(fd: FormData) {
  return {
    linkedin_url: String(fd.get("linkedin_url") ?? ""),
    crunchbase_url: String(fd.get("crunchbase_url") ?? ""),
    ticker: String(fd.get("ticker") ?? ""),
    notes: String(fd.get("notes") ?? ""),
  };
}

function metadataToJson(meta: Record<string, unknown>): Json {
  const parsed = entityMetadataSchema.safeParse(meta);
  if (!parsed.success) {
    return {};
  }
  return stripEmptyMetadata(parsed.data as Record<string, unknown>) as Json;
}

export async function createEntity(
  _prev: EntityActionState | null,
  formData: FormData,
): Promise<EntityActionState | null> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
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

  const rawMeta = formMeta(formData);

  const parsed = createEntitySchema.safeParse({
    type: String(formData.get("type") ?? ""),
    name: String(formData.get("name") ?? ""),
    domain: String(formData.get("domain") ?? ""),
    description: String(formData.get("description") ?? ""),
    metadata: rawMeta,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const metadata = metadataToJson(parsed.data.metadata ?? rawMeta);

  const { data, error } = await ctx.supabase
    .from("tracked_entities")
    .insert({
      organization_id: ctx.organization.id,
      type: parsed.data.type,
      name: parsed.data.name,
      domain: parsed.data.domain || null,
      description: parsed.data.description || null,
      metadata,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { formError: error.message };
  }

  revalidatePath(`/w/${orgSlug}`, "layout");
  redirect(`/w/${orgSlug}/entities/${data.id}`);
}

export async function updateEntity(
  _prev: EntityActionState | null,
  formData: FormData,
): Promise<EntityActionState | null> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return { formError: "Workspace not found or access denied." };
  }

  const rawMeta = formMeta(formData);

  const parsed = updateEntityFormSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    type: String(formData.get("type") ?? ""),
    name: String(formData.get("name") ?? ""),
    domain: String(formData.get("domain") ?? ""),
    description: String(formData.get("description") ?? ""),
    metadata: rawMeta,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, ...fields } = parsed.data;

  const { data: row, error: findErr } = await ctx.supabase
    .from("tracked_entities")
    .select("id")
    .eq("organization_id", ctx.organization.id)
    .eq("id", id)
    .maybeSingle();

  if (findErr || !row) {
    return { formError: "Entity not found in this workspace." };
  }

  const { error } = await ctx.supabase
    .from("tracked_entities")
    .update({
      type: fields.type,
      name: fields.name,
      domain: fields.domain || null,
      description: fields.description || null,
      metadata: metadataToJson(fields.metadata ?? rawMeta),
    })
    .eq("id", id)
    .eq("organization_id", ctx.organization.id);

  if (error) {
    return { formError: error.message };
  }

  revalidatePath(`/w/${orgSlug}`, "layout");
  redirect(`/w/${orgSlug}/entities/${id}`);
}

export async function setEntityActive(formData: FormData): Promise<void> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const isActive = formData.get("isActive") === "true";

  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx || !entityId) {
    return;
  }

  await ctx.supabase
    .from("tracked_entities")
    .update({ is_active: isActive })
    .eq("id", entityId)
    .eq("organization_id", ctx.organization.id);

  revalidatePath(`/w/${orgSlug}`, "layout");
}
