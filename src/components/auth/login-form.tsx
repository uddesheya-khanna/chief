"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInWithEmail, type AuthFieldErrors } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, action, pending] = useActionState<
    AuthFieldErrors | null,
    FormData
  >(signInWithEmail, null);

  return (
    <form action={action} className="space-y-5">
      {nextPath ? (
        <input type="hidden" name="next" value={nextPath} />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
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
          autoComplete="current-password"
          required
        />
        {state?.password?.length ? (
          <p className="text-xs text-destructive">{state.password[0]}</p>
        ) : null}
      </div>
      {state?._form?.length ? (
        <p className="text-sm text-destructive">{state._form[0]}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/auth/signup" className="text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
