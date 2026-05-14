"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUpWithEmail, type AuthFieldErrors } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const [state, action, pending] = useActionState<
    AuthFieldErrors | null,
    FormData
  >(signUpWithEmail, null);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Jordan Lee"
        />
        {state?.fullName?.length ? (
          <p className="text-xs text-destructive">{state.fullName[0]}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
        />
        {state?.email?.length ? (
          <p className="text-xs text-destructive">{state.email[0]}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state?.password?.length ? (
          <p className="text-xs text-destructive">{state.password[0]}</p>
        ) : null}
      </div>
      {state?._form?.length ? (
        <p className="text-sm text-destructive">{state._form[0]}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have access?{" "}
        <Link href="/auth/login" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
