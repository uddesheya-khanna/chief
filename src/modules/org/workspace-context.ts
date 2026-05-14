import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Organization } from "@/types/database";

import { loadOrganizationForUser } from "./loaders";

export type WorkspaceContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organization: Organization;
  role: string;
};

/** Deduped per request (layout + pages sharing the same slug). */
export const getWorkspaceContext = cache(
  async (orgSlug: string): Promise<WorkspaceContext | null> => {
    const supabase = await createSupabaseServerClient();
    const row = await loadOrganizationForUser(supabase, orgSlug);
    if (!row) {
      return null;
    }
    return {
      supabase,
      organization: row.organization,
      role: row.role,
    };
  },
);
