import Link from "next/link";

import { markAlertRead, markAllAlertsRead } from "@/actions/alerts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  groupAlertsByDay,
  type AlertWithEvent,
} from "@/modules/alerts/loaders";
import { entitySignalDetailHref } from "@/modules/events/event-url";

function formatDay(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function severityBorder(severity: string) {
  if (severity === "high") {
    return "border-l-[3px] border-l-[var(--signal-high)]";
  }
  if (severity === "medium") {
    return "border-l-[3px] border-l-[var(--signal-med)]";
  }
  return "border-l-[3px] border-l-transparent";
}

export function AlertsCenter({
  orgSlug,
  alerts,
}: {
  orgSlug: string;
  alerts: AlertWithEvent[];
}) {
  const groups = groupAlertsByDay(alerts);
  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="space-y-6">
      <AlertsToolbar orgSlug={orgSlug} unread={unread} />

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/80 px-6 py-14 text-center text-sm text-muted-foreground">
          No alerts yet. Monitoring rules will surface matching intelligence here.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.date} className="space-y-2">
              <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                {formatDay(group.date)}
              </h2>
              <ul className="divide-y divide-border/60 rounded-lg border border-border/70">
                {group.alerts.map((alert) => (
                  <AlertRow key={alert.id} orgSlug={orgSlug} alert={alert} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertsToolbar({
  orgSlug,
  unread,
}: {
  orgSlug: string;
  unread: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {unread > 0
          ? `${unread} unread alert${unread === 1 ? "" : "s"}`
          : "All caught up"}
      </p>
      {unread > 0 ? (
        <form action={markAllAlertsRead}>
          <input type="hidden" name="orgSlug" value={orgSlug} />
          <Button type="submit" variant="outline" size="sm">
            Mark all read
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function AlertRow({ orgSlug, alert }: { orgSlug: string; alert: AlertWithEvent }) {
  const entityId = alert.intelligence_events?.entity_id ?? "";
  const href = entityId
    ? entitySignalDetailHref(orgSlug, entityId, alert.event_id)
    : "#";
  const explain = alert.explain as { rule_name?: string; reasons?: string[] };

  return (
    <li
      className={cn(
        "px-4 py-3.5 pl-3.5 transition-colors hover:bg-muted/20",
        severityBorder(alert.severity),
        !alert.is_read && "bg-muted/10",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[14px] font-medium text-foreground">{alert.title}</p>
          <p className="line-clamp-2 text-[13px] text-muted-foreground">
            {alert.body}
          </p>
          {explain.rule_name ? (
            <p className="text-[11px] text-muted-foreground">
              Rule: {explain.rule_name}
              {explain.reasons?.[0] ? ` · ${explain.reasons[0]}` : ""}
            </p>
          ) : null}
          {entityId ? (
            <Link
              href={href}
              className="text-[12px] text-foreground/80 underline-offset-2 hover:underline"
            >
              View signal
            </Link>
          ) : null}
        </div>
        {!alert.is_read ? (
          <form action={markAlertRead}>
            <input type="hidden" name="orgSlug" value={orgSlug} />
            <input type="hidden" name="alertId" value={alert.id} />
            <Button type="submit" variant="ghost" size="sm" className="h-8 text-xs">
              Mark read
            </Button>
          </form>
        ) : null}
      </div>
    </li>
  );
}
