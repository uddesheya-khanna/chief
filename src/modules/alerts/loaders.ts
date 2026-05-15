import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const ALERT_COLUMNS =
  "id, organization_id, user_id, event_id, monitoring_rule_id, severity, title, body, explain, dedupe_key, is_read, read_at, created_at";

export type IntelligenceAlertRow =
  Database["public"]["Tables"]["intelligence_alerts"]["Row"];

export type AlertWithEvent = IntelligenceAlertRow & {
  intelligence_events: { entity_id: string } | null;
};

const ALERT_WITH_EVENT =
  `${ALERT_COLUMNS}, intelligence_events ( entity_id )`;

export async function countUnreadAlerts(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("intelligence_alerts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_read", false);

  if (error) {
    console.error("[alerts:countUnread]", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function listAlerts(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<AlertWithEvent[]> {
  const limit = options?.limit ?? 50;
  let qb = supabase
    .from("intelligence_alerts")
    .select(ALERT_WITH_EVENT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.unreadOnly) {
    qb = qb.eq("is_read", false);
  }

  const { data, error } = await qb;
  if (error) {
    console.error("[alerts:list]", error.message);
    return [];
  }
  return (data ?? []) as AlertWithEvent[];
}

export type GroupedAlerts = {
  date: string;
  alerts: AlertWithEvent[];
};

export function groupAlertsByDay(alerts: AlertWithEvent[]): GroupedAlerts[] {
  const map = new Map<string, AlertWithEvent[]>();

  for (const alert of alerts) {
    const day = alert.created_at.slice(0, 10);
    const list = map.get(day) ?? [];
    list.push(alert);
    map.set(day, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, alerts: items }));
}
