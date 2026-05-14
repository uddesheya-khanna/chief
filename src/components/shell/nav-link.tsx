"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavLinkProps = React.ComponentProps<typeof Link> & {
  activePrefix?: boolean;
};

export function NavLink({
  className,
  activePrefix = true,
  href,
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  const hrefStr = typeof href === "string" ? href : href.pathname ?? "";
  const active = activePrefix
    ? pathname === hrefStr || pathname.startsWith(`${hrefStr}/`)
    : pathname === hrefStr;

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
