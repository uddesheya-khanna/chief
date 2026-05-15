import { createClient } from "@supabase/supabase-js";

import { getClientEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role client for ingestion pipelines and cron only.
 * Never use in user-triggered request handlers without additional guards.
 */
export function createSupabaseServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for ingestion pipelines.",
    );
  }

  const { NEXT_PUBLIC_SUPABASE_URL } = getClientEnv();

  return createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
