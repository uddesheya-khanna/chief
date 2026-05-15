import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const RULE_COLUMNS =
  "id, organization_id, entity_id, name, is_active, min_signal_score, event_types, source_types, recency_hours, last_triggered_at, last_matched_event_id, trigger_count, created_by, created_at, updated_at";

export type MonitoringRuleRow =
  Database["public"]["Tables"]["monitoring_rules"]["Row"];

export async function listMonitoringRules(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  entityId?: string,
): Promise<MonitoringRuleRow[]> {
  let qb = supabase
    .from("monitoring_rules")
    .select(RULE_COLUMNS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (entityId) {
    qb = qb.or(`entity_id.is.null,entity_id.eq.${entityId}`);
  }

  const { data, error } = await qb;
  if (error) {
    console.error("[monitoring:list]", error.message);
    return [];
  }
  return data ?? [];
}
