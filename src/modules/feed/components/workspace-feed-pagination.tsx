import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { workspaceFeedHref } from "@/modules/feed/feed-href";
import type { WorkspaceFeedQuery } from "@/modules/feed/search-params";
import {
  WORKSPACE_FEED_PAGE_SIZE,
  serializeWorkspaceFeedQuery,
} from "@/modules/feed/search-params";

export function WorkspaceFeedPagination({
  orgSlug,
  query,
  total,
}: {
  orgSlug: string;
  query: WorkspaceFeedQuery;
  total: number;
}) {
  const pageSize = WORKSPACE_FEED_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);

  if (total <= 0 || totalPages <= 1) {
    return null;
  }

  const prevQuery: WorkspaceFeedQuery = { ...query, page: Math.max(1, page - 1) };
  const nextQuery: WorkspaceFeedQuery = {
    ...query,
    page: Math.min(totalPages, page + 1),
  };

  const prevHref = workspaceFeedHref(
    orgSlug,
    serializeWorkspaceFeedQuery(prevQuery),
  );
  const nextHref = workspaceFeedHref(
    orgSlug,
    serializeWorkspaceFeedQuery(nextQuery),
  );

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4"
      aria-label="Feed pagination"
    >
      <p className="text-[13px] text-muted-foreground">
        Page {page} of {totalPages}
        <span className="mx-2 text-border">·</span>
        {total} signal{total === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        <Link
          href={prevHref}
          prefetch={false}
          aria-disabled={page <= 1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page <= 1 && "pointer-events-none opacity-50",
          )}
        >
          Previous
        </Link>
        <Link
          href={nextHref}
          prefetch={false}
          aria-disabled={page >= totalPages}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page >= totalPages && "pointer-events-none opacity-50",
          )}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
