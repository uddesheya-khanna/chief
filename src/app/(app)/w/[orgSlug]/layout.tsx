import { notFound } from "next/navigation";
import { Toaster } from "sonner";

import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ContentContainer } from "@/components/primitives/content-container";
import { loadUserOrganizations } from "@/modules/org/loaders";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return { title: "Workspace" };
  }
  return { title: ctx.organization.name };
}

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(orgSlug);

  if (!ctx) {
    notFound();
  }

  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const organizations = await loadUserOrganizations(ctx.supabase);

  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0">
          <AppSidebar orgSlug={orgSlug} organizations={organizations} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            orgSlug={orgSlug}
            organizations={organizations}
            workspaceName={ctx.organization.name}
            userEmail={profile?.email ?? user.email ?? ""}
            userDisplayName={profile?.full_name ?? null}
          />
          <ContentContainer className="flex-1 py-8 sm:py-10">
            <div className="min-h-[50vh]">{children}</div>
          </ContentContainer>
        </div>
      </div>
      <Toaster closeButton />
    </>
  );
}
