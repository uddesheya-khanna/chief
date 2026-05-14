import { workspaceHref } from "@/modules/shell/nav";

export function workspaceFeedHref(
  orgSlug: string,
  search?: string,
): string {
  const base = workspaceHref(orgSlug, "/feed");
  if (!search || search.length === 0) {
    return base;
  }
  return `${base}?${search}`;
}
