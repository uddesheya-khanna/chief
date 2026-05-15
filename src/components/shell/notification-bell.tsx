import Link from "next/link";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";
import { workspaceHref } from "@/modules/shell/nav";

export function NotificationBell({
  orgSlug,
  unreadCount,
}: {
  orgSlug: string;
  unreadCount: number;
}) {
  const href = workspaceHref(orgSlug, "/alerts");

  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
      )}
      aria-label={
        unreadCount > 0
          ? `${unreadCount} unread alerts`
          : "Alerts — no unread items"
      }
    >
      <Bell className="size-[18px]" aria-hidden />
      {unreadCount > 0 ? (
        <span className="absolute right-1.5 top-1.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-medium leading-none text-background">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
