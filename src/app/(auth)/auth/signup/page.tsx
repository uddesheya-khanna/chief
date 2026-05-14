import type { Metadata } from "next";
import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";
import { Surface } from "@/components/primitives/surface";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignupPage() {
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
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You will create a workspace on the next step.
        </p>
      </div>
      <Surface variant="inset" className="p-6 sm:p-8">
        <SignupForm />
      </Surface>
    </div>
  );
}
