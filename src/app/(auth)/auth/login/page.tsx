import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { Surface } from "@/components/primitives/surface";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string; error?: string }>;
}) {
  const { next, notice, error } = await searchParams;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Link
          href="/"
          className="font-heading text-[15px] font-semibold tracking-tight text-foreground"
        >
          Chief
        </Link>
        <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your work email to access your workspace.
        </p>
      </div>
      <Surface variant="inset" className="p-6 sm:p-8">
        {notice === "confirm_email" ? (
          <p className="mb-4 rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Check your inbox to confirm your email, then return here to sign in.
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {(() => {
              try {
                return decodeURIComponent(error);
              } catch {
                return error;
              }
            })()}
          </p>
        ) : null}
        <LoginForm nextPath={next} />
      </Surface>
    </div>
  );
}
