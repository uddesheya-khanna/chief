import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntityActiveToggle } from "@/modules/entities/components/entity-active-toggle";
import { EntityTypeBadge } from "@/modules/entities/components/entity-type-badge";
import { entityDetailHref } from "@/modules/entities/entity-url";
import type { TrackedEntityRow } from "@/modules/entities/loaders";
import { isEntityType } from "@/modules/entities/constants";

function formatShortDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function EntitiesTable({
  orgSlug,
  rows,
}: {
  orgSlug: string;
  rows: TrackedEntityRow[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b border-border/80 hover:bg-transparent">
          <TableHead className="h-10 w-[38%] pl-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Entity
          </TableHead>
          <TableHead className="h-10 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Type
          </TableHead>
          <TableHead className="h-10 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Domain
          </TableHead>
          <TableHead className="h-10 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Updated
          </TableHead>
          <TableHead className="h-10 pr-3 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Status
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const type = isEntityType(row.type) ? row.type : "market";
          const href = entityDetailHref(orgSlug, row.id);
          return (
            <TableRow
              key={row.id}
              className="group h-[52px] border-border/60 transition-colors hover:bg-muted/[0.35]"
            >
              <TableCell className="pl-3 align-middle font-medium">
                <Link
                  href={href}
                  className="block truncate text-foreground decoration-transparent underline-offset-4 transition-colors group-hover:underline"
                >
                  {row.name}
                </Link>
              </TableCell>
              <TableCell className="align-middle">
                <EntityTypeBadge type={type} />
              </TableCell>
              <TableCell className="max-w-[200px] align-middle">
                {row.domain ? (
                  <a
                    href={`https://${row.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate font-mono text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {row.domain}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="align-middle text-xs tabular-nums text-muted-foreground">
                {formatShortDate(row.updated_at)}
              </TableCell>
              <TableCell className="pr-3 text-right align-middle">
                <EntityActiveToggle
                  orgSlug={orgSlug}
                  entityId={row.id}
                  isActive={row.is_active}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
