import { buildAlertDedupeKey } from "@/lib/alerts/dedupe";
import { severityFromSignalScore } from "@/lib/alerts/severity";
import { evaluateMonitoringRule } from "@/lib/monitoring/evaluate";
import type {
  MonitoringRuleRow,
  RuleEvaluationEvent,
} from "@/lib/monitoring/types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/database";

const RULE_COLUMNS =
  "id, organization_id, entity_id, name, is_active, min_signal_score, event_types, source_types, recency_hours, trigger_count";

export type AlertEvaluationResult = {
  alertsCreated: number;
  rulesMatched: number;
  skippedDuplicate: number;
};

export async function evaluateMonitoringAndCreateAlerts(params: {
  organizationId: string;
  event: RuleEvaluationEvent & {
    implication?: string | null;
    source_url?: string | null;
  };
}): Promise<AlertEvaluationResult> {
  const supabase = createSupabaseServiceClient();
  const result: AlertEvaluationResult = {
    alertsCreated: 0,
    rulesMatched: 0,
    skippedDuplicate: 0,
  };

  let rulesQuery = supabase
    .from("monitoring_rules")
    .select(RULE_COLUMNS)
    .eq("organization_id", params.organizationId)
    .eq("is_active", true);

  rulesQuery = rulesQuery.or(
    `entity_id.is.null,entity_id.eq.${params.event.entity_id}`,
  );

  const { data: rules, error } = await rulesQuery;

  if (error) {
    console.error("[alerts:evaluate:rules]", error.message);
    return result;
  }

  const activeRules = (rules ?? []) as MonitoringRuleRow[];

  if (activeRules.length === 0) {
    const fallback = await createFallbackHighSignalAlert(
      supabase,
      params.organizationId,
      params.event,
    );
    if (fallback.created) {
      result.alertsCreated += 1;
    } else if (fallback.duplicate) {
      result.skippedDuplicate += 1;
    }
    return result;
  }

  const matchedRuleIds: string[] = [];

  for (const rule of activeRules) {
    const evaluation = evaluateMonitoringRule(rule, params.event);
    if (!evaluation.matched) {
      continue;
    }

    result.rulesMatched += 1;
    matchedRuleIds.push(rule.id);

    const dedupeKey = buildAlertDedupeKey({
      organizationId: params.organizationId,
      ruleId: rule.id,
      eventId: params.event.id,
    });

    const severity = severityFromSignalScore(params.event.signal_score);
    const explain: Json = {
      rule_id: rule.id,
      rule_name: rule.name,
      reasons: evaluation.reasons,
    };

    const inserted = await supabase.from("intelligence_alerts").insert({
      organization_id: params.organizationId,
      user_id: null,
      event_id: params.event.id,
      monitoring_rule_id: rule.id,
      severity,
      title: params.event.title,
      body:
        params.event.implication?.trim() ||
        params.event.summary.slice(0, 400),
      explain,
      dedupe_key: dedupeKey,
    });

    if (inserted.error) {
      if (inserted.error.code === "23505") {
        result.skippedDuplicate += 1;
      } else {
        console.error("[alerts:evaluate:insert]", inserted.error.message);
      }
      continue;
    }

    result.alertsCreated += 1;

    await supabase
      .from("monitoring_rules")
      .update({
        last_triggered_at: new Date().toISOString(),
        last_matched_event_id: params.event.id,
        trigger_count: rule.trigger_count + 1,
      })
      .eq("id", rule.id);
  }

  console.log("[alerts:evaluate]", {
    organizationId: params.organizationId,
    eventId: params.event.id,
    ...result,
    matchedRuleIds,
  });

  return result;
}

async function createFallbackHighSignalAlert(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  organizationId: string,
  event: RuleEvaluationEvent & {
    implication?: string | null;
  },
): Promise<{ created: boolean; duplicate: boolean }> {
  if (event.signal_score < 80) {
    return { created: false, duplicate: false };
  }

  const dedupeKey = buildAlertDedupeKey({
    organizationId,
    ruleId: null,
    eventId: event.id,
  });

  const { error } = await supabase.from("intelligence_alerts").insert({
    organization_id: organizationId,
    user_id: null,
    event_id: event.id,
    monitoring_rule_id: null,
    severity: "high",
    title: event.title,
    body: event.implication?.trim() || event.summary.slice(0, 400),
    explain: {
      rule_id: null,
      rule_name: "High-signal default",
      reasons: [`Default alert for signal score ${event.signal_score}`],
    },
    dedupe_key: dedupeKey,
  });

  if (error?.code === "23505") {
    return { created: false, duplicate: true };
  }
  if (error) {
    console.error("[alerts:fallback]", error.message);
    return { created: false, duplicate: false };
  }

  return { created: true, duplicate: false };
}
