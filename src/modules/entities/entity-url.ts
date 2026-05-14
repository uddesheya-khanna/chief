import { workspaceHref } from "@/modules/shell/nav";

export function entityDetailHref(orgSlug: string, entityId: string) {
  return workspaceHref(orgSlug, `/entities/${entityId}`);
}

export function entityEditHref(orgSlug: string, entityId: string) {
  return workspaceHref(orgSlug, `/entities/${entityId}/edit`);
}

export function entityNewHref(orgSlug: string, type?: string) {
  const base = workspaceHref(orgSlug, "/entities/new");
  return type ? `${base}?type=${encodeURIComponent(type)}` : base;
}
