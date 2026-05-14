import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Organization } from "@/types/database";

export type UserOrganization = Organization & { role: string };

export async function loadUserOrganizations(
  supabase: SupabaseClient<Database>,
): Promise<UserOrganization[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data: memberships, error: mErr } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id);

  if (mErr || !memberships?.length) {
    return [];
  }

  const ids = memberships.map((m) => m.organization_id);
  const { data: orgs, error: oErr } = await supabase
    .from("organizations")
    .select("*")
    .in("id", ids);

  if (oErr || !orgs) {
    return [];
  }

  orgs.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const roleByOrg = new Map(
    memberships.map((m) => [m.organization_id, m.role]),
  );

  return orgs.map((org) => ({
    ...org,
    role: roleByOrg.get(org.id) ?? "member",
  }));
}

export async function loadOrganizationForUser(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<{ organization: Organization; role: string } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (orgError || !org) {
    return null;
  }

  const { data: membership, error: memError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memError || !membership) {
    return null;
  }

  return { organization: org, role: membership.role };
}
