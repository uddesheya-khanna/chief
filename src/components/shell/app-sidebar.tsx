import Link from "next/link";

import { NavLink } from "@/components/shell/nav-link";
import { OrgSwitcher } from "@/components/shell/org-switcher";
import { Separator } from "@/components/ui/separator";
import type { UserOrganization } from "@/modules/org/loaders";
import {
  entitiesNav,
  intelligenceNav,
  systemNav,
  type NavItem,
} from "@/modules/shell/nav";

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="space-y-2">
      <p className="px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/90">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.href} href={item.href} className="font-medium">
            <item.icon className="size-4 text-muted-foreground" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

type AppSidebarProps = {
  orgSlug: string;
  organizations: UserOrganization[];
};

export function AppSidebar({ orgSlug, organizations }: AppSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center px-4">
        <Link
          href="/"
          className="font-heading text-[15px] font-semibold tracking-tight text-sidebar-foreground"
        >
          Chief
        </Link>
      </div>
      <div className="px-3 pb-2">
        <OrgSwitcher organizations={organizations} currentSlug={orgSlug} />
      </div>
      <Separator className="bg-sidebar-border/80" />
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
        <NavSection title="Intelligence" items={intelligenceNav(orgSlug)} />
        <NavSection title="Entities" items={entitiesNav(orgSlug)} />
        <NavSection title="System" items={systemNav(orgSlug)} />
      </nav>
    </aside>
  );
}
