"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createWorkspaceSchema } from "@/modules/org/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkspaceFieldErrors = {
  name?: string[];
  slug?: string[];
  _form?: string[];
};

export async function createWorkspace(
  _prev: WorkspaceFieldErrors | null,
  formData: FormData,
): Promise<WorkspaceFieldErrors | null> {
  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return parsed.error.flatten().fieldErrors as WorkspaceFieldErrors;
  }

  const supabase = await createSupabaseServerClient();
  const { data: orgId, error } = await supabase.rpc(
    "create_organization_with_owner",
    {
      p_name: parsed.data.name,
      p_slug: parsed.data.slug,
    },
  );

  if (error) {
    return { _form: [error.message] };
  }

  if (!orgId) {
    return { _form: ["Could not create workspace."] };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .single();

  revalidatePath("/", "layout");
  if (org?.slug) {
    redirect(`/w/${org.slug}/dashboard`);
  }
  redirect("/onboarding");
}
