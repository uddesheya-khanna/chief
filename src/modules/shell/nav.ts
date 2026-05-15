import {
  Bell,
  FileText,
  LayoutDashboard,
  LineChart,
  Radar,
  Search,
  Settings2,
  Users,
  Building2,
  Handshake,
  Globe2,
  Layers,
  Bookmark,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  match?: "exact" | "prefix";
};

export function workspaceHref(orgSlug: string, path: string) {
  return `/w/${orgSlug}${path.startsWith("/") ? path : `/${path}`}`;
}

export function intelligenceNav(orgSlug: string): NavItem[] {
  const w = (p: string) => workspaceHref(orgSlug, p);
  return [
    { label: "Dashboard", href: w("/dashboard"), icon: LayoutDashboard },
    { label: "Feed", href: w("/feed"), icon: LineChart },
    { label: "Search", href: w("/search"), icon: Search },
    { label: "Alerts", href: w("/alerts"), icon: Bell },
    { label: "Digests", href: w("/digests"), icon: FileText },
    { label: "Monitoring", href: w("/monitoring"), icon: Radar },
    { label: "Watch", href: w("/watch"), icon: Bookmark },
  ];
}

export function entitiesNav(orgSlug: string): NavItem[] {
  const w = (p: string) => workspaceHref(orgSlug, p);
  return [
    {
      label: "Directory",
      href: w("/entities"),
      icon: Layers,
      match: "exact",
    },
    { label: "Competitors", href: w("/competitors"), icon: Users },
    { label: "Investors", href: w("/investors"), icon: Building2 },
    { label: "Partners", href: w("/partners"), icon: Handshake },
    { label: "Market", href: w("/market"), icon: Globe2 },
  ];
}

export function systemNav(orgSlug: string): NavItem[] {
  const w = (p: string) => workspaceHref(orgSlug, p);
  return [{ label: "Settings", href: w("/settings"), icon: Settings2 }];
}
