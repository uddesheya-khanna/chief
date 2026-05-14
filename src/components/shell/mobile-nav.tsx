"use client";

import { Menu } from "lucide-react";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UserOrganization } from "@/modules/org/loaders";

type MobileNavProps = {
  orgSlug: string;
  organizations: UserOrganization[];
};

export function MobileNav({ orgSlug, organizations }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "lg:hidden",
        )}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <AppSidebar orgSlug={orgSlug} organizations={organizations} />
      </SheetContent>
    </Sheet>
  );
}
