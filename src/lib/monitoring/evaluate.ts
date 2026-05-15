import type {
  MonitoringRuleRow,
  RuleEvaluationEvent,
  RuleMatchResult,
} from "@/lib/monitoring/types";

/**
 * Deterministic, explainable rule evaluation — no LLM involvement.
 */
export function evaluateMonitoringRule(
  rule: MonitoringRuleRow,
  event: RuleEvaluationEvent,
): RuleMatchResult {
  const reasons: string[] = [];

  if (!rule.is_active) {
    return { matched: false, reasons: ["Rule is disabled"] };
  }

  if (rule.entity_id && rule.entity_id !== event.entity_id) {
    return {
      matched: false,
      reasons: ["Event entity does not match rule scope"],
    };
  }

  if (event.signal_score < rule.min_signal_score) {
    return {
      matched: false,
      reasons: [
        `Signal score ${event.signal_score} below threshold ${rule.min_signal_score}`,
      ],
    };
  }
  reasons.push(
    `Signal score ${event.signal_score} meets threshold ${rule.min_signal_score}`,
  );

  if (rule.event_types.length > 0 && !rule.event_types.includes(event.event_type)) {
    return {
      matched: false,
      reasons: [`Event type ${event.event_type} not in rule filter`],
    };
  }
  if (rule.event_types.length > 0) {
    reasons.push(`Event type ${event.event_type} matches filter`);
  }

  if (
    rule.source_types.length > 0 &&
    !rule.source_types.includes(event.source_type)
  ) {
    return {
      matched: false,
      reasons: [`Source type ${event.source_type} not in rule filter`],
    };
  }
  if (rule.source_types.length > 0) {
    reasons.push(`Source type ${event.source_type} matches filter`);
  }

  const detectedMs = new Date(event.detected_at).getTime();
  if (Number.isNaN(detectedMs)) {
    return { matched: false, reasons: ["Invalid event timestamp"] };
  }

  const ageHours = (Date.now() - detectedMs) / (1000 * 60 * 60);
  if (ageHours > rule.recency_hours) {
    return {
      matched: false,
      reasons: [
        `Event is ${Math.round(ageHours)}h old; window is ${rule.recency_hours}h`,
      ],
    };
  }
  reasons.push(`Within ${rule.recency_hours}h recency window`);

  return { matched: true, reasons };
}
