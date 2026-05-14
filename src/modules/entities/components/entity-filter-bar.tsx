import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  ENTITY_TYPES,
  ENTITY_TYPE_LABEL_PLURAL,
  type EntityType,
} from "@/modules/entities/constants";
import { workspaceHref } from "@/modules/shell/nav";
import type { EntityListQuery } from "@/modules/entities/schemas";

const statuses = [
  { value: "active" as const, label: "Active" },
  { value: "archived" as const, label: "Archived" },
  { value: "all" as const, label: "All" },
];

function mergeQuery(
  current: EntityListQuery,
  patch: Partial<EntityListQuery>,
  lockedType?: EntityType,
): EntityListQuery {
  return {
    type:
      lockedType ??
      (Object.hasOwn(patch, "type") ? patch.type : current.type),
    q: Object.hasOwn(patch, "q") ? patch.q : current.q,
    status: patch.status ?? current.status,
  };
}

function buildListUrl(
  orgSlug: string,
  listSegment: string,
  current: EntityListQuery,
  patch: Partial<EntityListQuery>,
  lockedType?: EntityType,
) {
  const base = workspaceHref(orgSlug, `/${listSegment}`);
  const merged = mergeQuery(current, patch, lockedType);
  const sp = new URLSearchParams();
  if (merged.type) {
    sp.set("type", merged.type);
  }
  if (merged.q) {
    sp.set("q", merged.q);
  }
  if (merged.status && merged.status !== "active") {
    sp.set("status", merged.status);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export function EntityFilterBar({
  orgSlug,
  listSegment,
  query,
  lockedType,
}: {
  orgSlug: string;
  /** URL segment after workspace, e.g. `entities` or `competitors`. */
  listSegment: string;
  query: EntityListQuery;
  lockedType?: EntityType;
}) {
  const typeFilter = lockedType ?? query.type;

  return (
    <div className="flex flex-col gap-6 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {!lockedType ? (
          <>
            <FilterChip
              href={buildListUrl(
                orgSlug,
                listSegment,
                query,
                { type: undefined },
                lockedType,
              )}
              active={!query.type}
            >
              All types
            </FilterChip>
            {ENTITY_TYPES.map((t) => (
              <FilterChip
                key={t}
                href={buildListUrl(orgSlug, listSegment, query, { type: t }, lockedType)}
                active={query.type === t}
              >
                {ENTITY_TYPE_LABEL_PLURAL[t]}
              </FilterChip>
            ))}
          </>
        ) : (
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {ENTITY_TYPE_LABEL_PLURAL[lockedType]}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-border/80 bg-muted/25 p-0.5">
          {statuses.map((s) => (
            <FilterChip
              key={s.value}
              href={buildListUrl(
                orgSlug,
                listSegment,
                query,
                { status: s.value },
                lockedType,
              )}
              active={query.status === s.value}
              className="border-0 bg-transparent px-2.5 py-1 text-xs shadow-none"
            >
              {s.label}
            </FilterChip>
          ))}
        </div>
        <form
          method="get"
          action={workspaceHref(orgSlug, `/${listSegment}`)}
          className="flex items-center gap-2"
        >
          {typeFilter ? (
            <input type="hidden" name="type" value={typeFilter} />
          ) : null}
          <input type="hidden" name="status" value={query.status} />
          <input
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="Search by name…"
            className="h-8 w-44 rounded-lg border border-border/80 bg-background px-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:w-56"
          />
          <button
            type="submit"
            className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
  className,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded-md border border-transparent px-2 py-1 text-xs font-medium transition-colors duration-150",
        active
          ? "border-border/90 bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
