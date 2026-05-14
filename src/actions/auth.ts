"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/modules/auth/schemas";

function safeInternalPath(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/onboarding";
  }
  return next;
}

export type AuthFieldErrors = {
  email?: string[];
  password?: string[];
  fullName?: string[];
  _form?: string[];
};

export async function signInWithEmail(
  _prevState: AuthFieldErrors | null,
  formData: FormData,
): Promise<AuthFieldErrors | null> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.flatten().fieldErrors as AuthFieldErrors;
  }

  const nextPath = safeInternalPath(parsed.data.next);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { _form: [error.message] };
  }

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function signUpWithEmail(
  _prevState: AuthFieldErrors | null,
  formData: FormData,
): Promise<AuthFieldErrors | null> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName") || undefined,
  });

  if (!parsed.success) {
    return parsed.error.flatten().fieldErrors as AuthFieldErrors;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName ?? "",
      },
    },
  });

  if (error) {
    return { _form: [error.message] };
  }

  revalidatePath("/", "layout");

  if (!data.session) {
    redirect("/auth/login?notice=confirm_email");
  }

  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
