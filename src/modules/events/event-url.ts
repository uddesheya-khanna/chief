import { workspaceHref } from "@/modules/shell/nav";

export function entitySignalsHref(orgSlug: string, entityId: string) {
  return workspaceHref(orgSlug, `/entities/${entityId}/signals`);
}

export function entitySignalDetailHref(
  orgSlug: string,
  entityId: string,
  eventId: string,
) {
  return workspaceHref(orgSlug, `/entities/${entityId}/signals/${eventId}`);
}

export function entitySignalNewHref(orgSlug: string, entityId: string) {
  return workspaceHref(orgSlug, `/entities/${entityId}/signals/new`);
}

export function entitySettingsHref(orgSlug: string, entityId: string) {
  return workspaceHref(orgSlug, `/entities/${entityId}/settings`);
}
