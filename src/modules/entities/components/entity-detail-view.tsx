import Link from "next/link";
import { ArrowUpRight, Pencil } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EntityActiveToggle } from "@/modules/entities/components/entity-active-toggle";
import { EntityTypeBadge } from "@/modules/entities/components/entity-type-badge";
import { entityEditHref } from "@/modules/entities/entity-url";
import {
  entityTypeHref,
  isEntityType,
} from "@/modules/entities/constants";
import { normalizeMetadata } from "@/modules/entities/loaders";
import type { TrackedEntityRow } from "@/modules/entities/loaders";
import { workspaceHref } from "@/modules/shell/nav";

function formatLongDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function EntityDetailHeader({
  orgSlug,
  entity,
}: {
  orgSlug: string;
  entity: TrackedEntityRow;
}) {
  const type = isEntityType(entity.type) ? entity.type : "market";

  return (
    <div className="flex flex-col gap-6 border-b border-border/70 pb-8 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <EntityTypeBadge type={type} />
          {entity.domain ? (
            <a
              href={`https://${entity.domain}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {entity.domain}
              <ArrowUpRight className="size-3.5" />
            </a>
          ) : null}
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {entity.name}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {entity.description?.trim()
            ? entity.description
            : "No positioning narrative yet. Edit this entity to capture why it matters to your office."}
        </p>
        <p className="text-xs text-muted-foreground">
          Last updated {formatLongDate(entity.updated_at)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-end">
        <EntityActiveToggle
          orgSlug={orgSlug}
          entityId={entity.id}
          isActive={entity.is_active}
        />
        <Link
          href={entityEditHref(orgSlug, entity.id)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex items-center justify-center gap-1.5",
          )}
        >
          <Pencil className="size-3.5" />
          Edit profile
        </Link>
      </div>
    </div>
  );
}

export function EntityReferencePanel({ entity }: { entity: TrackedEntityRow }) {
  const meta = normalizeMetadata(entity.metadata);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Reference
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Structured links and internal notes stay with the entity for downstream
          intelligence.
        </p>
      </div>
      <dl className="grid gap-6 sm:grid-cols-2">
        <MetaItem label="LinkedIn" value={meta.linkedin_url as string | undefined} />
        <MetaItem label="Crunchbase" value={meta.crunchbase_url as string | undefined} />
        <MetaItem label="Ticker" value={meta.ticker as string | undefined} />
        <MetaItem label="Notes" value={meta.notes as string | undefined} wide />
      </dl>
    </section>
  );
}

export function EntityDetailFooterNav({
  orgSlug,
  entity,
}: {
  orgSlug: string;
  entity: TrackedEntityRow;
}) {
  const type = isEntityType(entity.type) ? entity.type : "market";

  return (
    <section className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      <span>
        View in{" "}
        <Link
          href={entityTypeHref(orgSlug, type)}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {type} list
        </Link>
      </span>
      <span className="text-border">·</span>
      <Link
        href={workspaceHref(orgSlug, "/entities")}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        Full directory
      </Link>
    </section>
  );
}

function MetaItem({
  label,
  value,
  wide,
}: {
  label: string;
  value?: string;
  wide?: boolean;
}) {
  const has = value && value.trim();
  return (
    <div className={cn("space-y-1", wide && "sm:col-span-2")}>
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">
        {has ? (
          label === "LinkedIn" || label === "Crunchbase" ? (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="break-all text-primary underline-offset-4 hover:underline"
            >
              {value}
            </a>
          ) : (
            <span className="whitespace-pre-wrap leading-relaxed">{value}</span>
          )
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </dd>
    </div>
  );
}
