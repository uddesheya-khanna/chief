/**
 * Alert evaluation — invoked after intelligence events are persisted.
 */

import { evaluateMonitoringAndCreateAlerts } from "@/lib/alerts/evaluate";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const EVENT_COLUMNS =
  "id, organization_id, entity_id, event_type, source_type, signal_score, title, summary, implication, detected_at, source_url";

export async function processAlertsForEvent(eventId: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { data: event, error } = await supabase
    .from("intelligence_events")
    .select(EVENT_COLUMNS)
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    console.error("[jobs:alerts]", { eventId, error: error?.message });
    return;
  }

  await evaluateMonitoringAndCreateAlerts({
    organizationId: event.organization_id,
    event: {
      id: event.id,
      entity_id: event.entity_id,
      event_type: event.event_type,
      source_type: event.source_type,
      signal_score: event.signal_score,
      title: event.title,
      summary: event.summary,
      implication: event.implication,
      detected_at: event.detected_at,
      source_url: event.source_url,
    },
  });
}
