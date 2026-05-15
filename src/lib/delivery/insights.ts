import type { SupabaseClient } from "@supabase/supabase-js";

import { compareIntelligencePeriods } from "@/lib/intelligence/aggregate";
import { detectRecurringThemes } from "@/lib/intelligence/historical";
import type { Database } from "@/types/database";

type Db = SupabaseClient<Database>;

export type DeliveryInsight = {
  id: string;
  label: string;
  description: string;
  href?: string;
  priority: "high" | "medium" | "low";
};

export async function getWorkspaceDeliveryInsights(
  supabase: Db,
  organizationId: string,
  orgSlug: string,
): Promise<DeliveryInsight[]> {
  const insights: DeliveryInsight[] = [];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: highSignals } = await supabase
    .from("intelligence_events")
    .select("id, title, signal_score")
    .eq("organization_id", organizationId)
    .eq("is_dismissed", false)
    .gte("signal_score", 80)
    .gte("detected_at", weekAgo)
    .order("signal_score", { ascending: false })
    .limit(5);

  if ((highSignals?.length ?? 0) > 0) {
    insights.push({
      id: "high-signal-week",
      label: "High-signal events this week",
      description: `${highSignals!.length} signal(s) scored 80+ — review for immediate strategic relevance.`,
      href: `/w/${orgSlug}/feed?signal=high&from=${weekAgo.slice(0, 10)}`,
      priority: "high",
    });
  }

  const comparison = await compareIntelligencePeriods(
    supabase,
    organizationId,
    7,
  );

  if (comparison.deltaCount >= 3) {
    insights.push({
      id: "activity-surge",
      label: "Increasing workspace activity",
      description: `${comparison.currentPeriod.count} signals this period vs ${comparison.previousPeriod.count} prior (+${comparison.deltaCount}).`,
      href: `/w/${orgSlug}/digests`,
      priority: "medium",
    });
  }

  const { data: pricingEvents } = await supabase
    .from("intelligence_events")
    .select("id, title, summary, event_type, signal_score, detected_at")
    .eq("organization_id", organizationId)
    .eq("is_dismissed", false)
    .eq("event_type", "pricing_change")
    .gte("detected_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .limit(50);

  const themes = detectRecurringThemes(
    (pricingEvents ?? []) as Parameters<typeof detectRecurringThemes>[0],
  );
  const pricingTheme = themes.find((t) => t.eventType === "pricing_change");
  if (pricingTheme && pricingTheme.count >= 3) {
    insights.push({
      id: "pricing-theme",
      label: "Recurring pricing-related shifts",
      description: `${pricingTheme.count} pricing signals in 90 days — possible competitive pricing pressure.`,
      href: `/w/${orgSlug}/search?q=pricing`,
      priority: "high",
    });
  }

  const { data: execEvents } = await supabase
    .from("intelligence_events")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_dismissed", false)
    .eq("event_type", "exec_move")
    .gte("detected_at", weekAgo);

  if ((execEvents?.length ?? 0) > 0) {
    insights.push({
      id: "exec-moves",
      label: "Executive movement alerts",
      description: `${execEvents!.length} leadership signal(s) detected this week.`,
      href: `/w/${orgSlug}/feed?event_type=exec_move`,
      priority: "medium",
    });
  }

  return insights.sort(
    (a, b) => priorityRank(b.priority) - priorityRank(a.priority),
  );
}

function priorityRank(p: DeliveryInsight["priority"]) {
  if (p === "high") {
    return 3;
  }
  if (p === "medium") {
    return 2;
  }
  return 1;
}
