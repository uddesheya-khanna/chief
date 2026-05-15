export function buildAlertDedupeKey(params: {
  organizationId: string;
  ruleId: string | null;
  eventId: string;
}): string {
  if (params.ruleId) {
    return `rule:${params.ruleId}:event:${params.eventId}`;
  }
  return `org:${params.organizationId}:event:${params.eventId}`;
}

export function buildDigestBatchDedupeKey(params: {
  organizationId: string;
  digestType: string;
  periodStart: string;
}): string {
  const day = params.periodStart.slice(0, 10);
  return `digest:${params.organizationId}:${params.digestType}:${day}`;
}
