"use server";

import { revalidatePath } from "next/cache";

import { createRelationshipSchema } from "@/modules/relationships/schemas";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export type RelationshipActionState = {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
};

export async function createEntityRelationship(
  _prev: RelationshipActionState | null,
  formData: FormData,
): Promise<RelationshipActionState | null> {
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

  const parsed = createRelationshipSchema.safeParse({
    from_entity_id: String(formData.get("from_entity_id") ?? ""),
    to_entity_id: String(formData.get("to_entity_id") ?? ""),
    relationship_type: String(formData.get("relationship_type") ?? ""),
    valid_from: String(formData.get("valid_from") ?? "") || undefined,
    valid_until: String(formData.get("valid_until") ?? "") || undefined,
    note: String(formData.get("note") ?? "") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.from_entity_id === parsed.data.to_entity_id) {
    return { formError: "An entity cannot relate to itself." };
  }

  const metadata = parsed.data.note?.trim()
    ? { note: parsed.data.note.trim() }
    : {};

  const { error } = await ctx.supabase.from("entity_relationships").insert({
    organization_id: ctx.organization.id,
    from_entity_id: parsed.data.from_entity_id,
    to_entity_id: parsed.data.to_entity_id,
    relationship_type: parsed.data.relationship_type,
    valid_from: parsed.data.valid_from || null,
    valid_until: parsed.data.valid_until || null,
    metadata,
    created_by: user.id,
  });

  if (error) {
    return { formError: error.message };
  }

  revalidatePath(`/w/${orgSlug}/entities/${parsed.data.from_entity_id}`, "layout");
  revalidatePath(`/w/${orgSlug}/entities/${parsed.data.to_entity_id}`, "layout");
  return null;
}

export async function deleteEntityRelationship(formData: FormData): Promise<void> {
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const relationshipId = String(formData.get("relationshipId") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx || !relationshipId) {
    return;
  }

  await ctx.supabase
    .from("entity_relationships")
    .delete()
    .eq("id", relationshipId)
    .eq("organization_id", ctx.organization.id);

  if (entityId) {
    revalidatePath(`/w/${orgSlug}/entities/${entityId}`, "layout");
  }
}
