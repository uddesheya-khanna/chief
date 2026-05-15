import { Trash2 } from "lucide-react";

import {
  deleteMonitoringRule,
  toggleMonitoringRule,
} from "@/actions/monitoring-rules";
import { Button } from "@/components/ui/button";
import { MonitoringRuleForm } from "@/modules/monitoring/components/monitoring-rule-form";
import type { MonitoringRuleRow } from "@/modules/monitoring/loaders";
import type { TrackedEntityRow } from "@/modules/entities/loaders";

export function MonitoringRulesPanel({
  orgSlug,
  rules,
  entities,
}: {
  orgSlug: string;
  rules: MonitoringRuleRow[];
  entities: TrackedEntityRow[];
}) {
  return (
    <div className="space-y-8">
      <MonitoringRuleForm orgSlug={orgSlug} entities={entities} />

      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No monitoring rules yet. Create one to control alert delivery.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border/70">
          {rules.map((rule) => (
            <li key={rule.id} className="px-4 py-4">
              <RuleHeader rule={rule} entities={entities} />
              <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-muted-foreground">
                <span>Min score {rule.min_signal_score}</span>
                <span>·</span>
                <span>{rule.recency_hours}h window</span>
                {rule.event_types.length > 0 ? (
                  <>
                    <span>·</span>
                    <span>{rule.event_types.join(", ")}</span>
                  </>
                ) : null}
                {rule.last_triggered_at ? (
                  <>
                    <span>·</span>
                    <span>
                      Last triggered{" "}
                      {new Date(rule.last_triggered_at).toLocaleString()}
                    </span>
                  </>
                ) : null}
              </div>
              <div className="mt-3 flex gap-2">
                <form action={toggleMonitoringRule}>
                  <input type="hidden" name="orgSlug" value={orgSlug} />
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={rule.is_active ? "0" : "1"}
                  />
                  <Button type="submit" variant="outline" size="sm">
                    {rule.is_active ? "Disable" : "Enable"}
                  </Button>
                </form>
                <form action={deleteMonitoringRule}>
                  <input type="hidden" name="orgSlug" value={orgSlug} />
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label="Delete rule"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RuleHeader({
  rule,
  entities,
}: {
  rule: MonitoringRuleRow;
  entities: TrackedEntityRow[];
}) {
  const entity = entities.find((e) => e.id === rule.entity_id);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-sm font-medium text-foreground">{rule.name}</p>
      <span className="text-[12px] text-muted-foreground">
        {entity ? entity.name : "All entities"}
      </span>
      {!rule.is_active ? (
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          Disabled
        </span>
      ) : null}
    </div>
  );
}
