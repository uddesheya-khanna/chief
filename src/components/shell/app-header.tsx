import { MobileNav } from "@/components/shell/mobile-nav";
import { NotificationBell } from "@/components/shell/notification-bell";
import { UserMenu } from "@/components/shell/user-menu";
import type { UserOrganization } from "@/modules/org/loaders";

type AppHeaderProps = {
  orgSlug: string;
  organizations: UserOrganization[];
  workspaceName: string;
  userEmail: string;
  userDisplayName: string | null;
  unreadAlertCount: number;
};

export function AppHeader({
  orgSlug,
  organizations,
  workspaceName,
  userEmail,
  userDisplayName,
  unreadAlertCount,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav orgSlug={orgSlug} organizations={organizations} />
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-medium text-foreground">
            {workspaceName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Workspace overview
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <NotificationBell orgSlug={orgSlug} unreadCount={unreadAlertCount} />
        <UserMenu email={userEmail} displayName={userDisplayName} />
      </div>
    </header>
  );
}
