import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateWorkspaceForm } from "@/components/auth/create-workspace-form";
import { Surface } from "@/components/primitives/surface";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadUserOrganizations } from "@/modules/org/loaders";

export const metadata: Metadata = {
  title: "Workspace",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const orgs = await loadUserOrganizations(supabase);
  if (orgs.length > 0) {
    redirect(`/w/${orgs[0].slug}/dashboard`);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Name your workspace
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Workspaces keep intelligence, entities, and permissions isolated. You
          can belong to more than one.
        </p>
      </div>
      <Surface variant="default" className="p-6 sm:p-8">
        <CreateWorkspaceForm />
      </Surface>
    </div>
  );
}
