"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  serializeWorkspaceSearchQuery,
  type WorkspaceSearchQuery,
} from "@/modules/search/search-params";

export function WorkspaceSearchForm({
  query,
}: {
  query: WorkspaceSearchQuery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("q") ?? "").trim();
    startTransition(() => {
      const next: WorkspaceSearchQuery = {
        ...query,
        query: q,
        page: 1,
      };
      const qs = serializeWorkspaceSearchQuery(next);
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        name="q"
        defaultValue={query.query}
        placeholder="Search signals, summaries, implications…"
        disabled={isPending}
        className="h-[38px] flex-1 font-normal"
        autoComplete="off"
        spellCheck={false}
      />
      <Button type="submit" disabled={isPending} className="shrink-0">
        <Search className="size-4" aria-hidden />
        <span className="sr-only sm:not-sr-only sm:ml-2">
          {isPending ? "Searching…" : "Search"}
        </span>
      </Button>
    </form>
  );
}
