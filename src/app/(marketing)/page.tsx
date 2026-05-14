import Link from "next/link";
import { redirect } from "next/navigation";

import { ContentContainer } from "@/components/primitives/content-container";
import { buttonVariants } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadUserOrganizations } from "@/modules/org/loaders";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const orgs = await loadUserOrganizations(supabase);
    if (orgs.length > 0) {
      redirect(`/w/${orgs[0].slug}/dashboard`);
    }
    redirect("/onboarding");
  }

  return (
    <main>
      <ContentContainer className="py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Founder office intelligence
          </p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            The calm layer for strategic awareness.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Chief is the workspace where your team aligns on what matters in the
            market — structured, attributable, and designed for how executives
            actually decide.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className={cn(buttonVariants({ size: "lg" }), "min-w-[140px]")}
            >
              Start a workspace
            </Link>
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-w-[140px]",
              )}
            >
              Sign in
            </Link>
          </div>
        </div>
      </ContentContainer>
      <div className="border-t border-border/60 bg-muted/20">
        <ContentContainer className="py-12 text-center text-sm text-muted-foreground">
          Built as a modular monolith — auth, workspaces, and a shell ready for
          intelligence workflows.
        </ContentContainer>
      </div>
    </main>
  );
}
