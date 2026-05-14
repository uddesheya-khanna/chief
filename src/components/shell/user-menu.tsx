"use client";

import { LogOut } from "lucide-react";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  email: string;
  displayName: string | null;
};

export function UserMenu({ email, displayName }: UserMenuProps) {
  const label = displayName?.trim() || email.split("@")[0] || "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex max-w-[200px] items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-2.5 py-1.5 text-left text-sm font-medium shadow-sm outline-none transition-colors hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        data-slot="user-menu"
      >
        <span className="truncate">{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-xs text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-0 focus:bg-transparent">
          <form action={signOut} className="w-full">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start gap-2 px-2 font-normal"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
