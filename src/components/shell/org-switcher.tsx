"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { workspaceHref } from "@/modules/shell/nav";
import type { UserOrganization } from "@/modules/org/loaders";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type OrgSwitcherProps = {
  organizations: UserOrganization[];
  currentSlug: string;
};

export function OrgSwitcher({ organizations, currentSlug }: OrgSwitcherProps) {
  const router = useRouter();
  const current =
    organizations.find((o) => o.slug === currentSlug) ?? organizations[0];

  if (!current) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-9 w-full max-w-[220px] items-center justify-between gap-2 rounded-lg border border-sidebar-border/80 bg-background/60 px-2.5 text-left text-sm font-medium text-sidebar-foreground shadow-sm outline-none transition-colors hover:bg-background focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        data-slot="org-switcher"
      >
        <span className="truncate">{current.name}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Workspaces
          </DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              className={org.slug === currentSlug ? "bg-accent/60" : ""}
              onClick={() =>
                router.push(workspaceHref(org.slug, "/dashboard"))
              }
            >
              <span className="truncate">{org.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/onboarding")}>
            <Plus className="size-4" />
            New workspace
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
