"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavLinkProps = React.ComponentProps<typeof Link> & {
  /** `exact` — only the href path; `prefix` — href or nested paths (default). */
  match?: "exact" | "prefix";
};

export function NavLink({
  className,
  match = "prefix",
  href,
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  const hrefStr = typeof href === "string" ? href : href.pathname ?? "";
  const active =
    match === "exact"
      ? pathname === hrefStr
      : pathname === hrefStr || pathname.startsWith(`${hrefStr}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150",
        active
          ? "bg-sidebar-accent/90 text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        className,
      )}
      {...props}
    />
  );
}
