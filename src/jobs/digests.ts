/**
 * Digest generation jobs — cron or manual trigger.
 */

import { sendAlertDigestEmail } from "@/lib/alerts/email";
import { buildDigestBatchDedupeKey } from "@/lib/alerts/dedupe";
import {
  generateAndStoreDigest,
  generateWeeklyStrategicDigest,
} from "@/lib/delivery/digest";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function runDailyDigestForOrganization(
  organizationId: string,
  workspaceName: string,
): Promise<{ digestId?: string; error?: string }> {
  return generateAndStoreDigest({
    organizationId,
    workspaceName,
    digestType: "daily",
    periodDays: 1,
    minSignalScore: 50,
  });
}

export async function runWeeklyDigestForOrganization(
  organizationId: string,
  workspaceName: string,
): Promise<{ digestId?: string; error?: string }> {
  return generateWeeklyStrategicDigest(organizationId, workspaceName);
}

export async function runHighSignalRoundup(
  organizationId: string,
  workspaceName: string,
): Promise<{ digestId?: string; error?: string }> {
  return generateAndStoreDigest({
    organizationId,
    workspaceName,
    digestType: "high_signal",
    periodDays: 7,
    minSignalScore: 80,
  });
}

export async function runCompetitorWatchDigest(
  organizationId: string,
  workspaceName: string,
): Promise<{ digestId?: string; error?: string }> {
  return generateAndStoreDigest({
    organizationId,
    workspaceName,
    digestType: "competitor_watch",
    periodDays: 7,
    minSignalScore: 60,
    entityTypeFilter: "competitor",
  });
}

export async function sendDigestEmailToMembers(
  organizationId: string,
  digestId: string,
  digestTitle: string,
  summaryHtml: string,
): Promise<{ sent: number; skipped: number }> {
  const supabase = createSupabaseServiceClient();
  const dedupeKey = buildDigestBatchDedupeKey({
    organizationId,
    digestType: "email_batch",
    periodStart: new Date().toISOString(),
  });

  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId);

  let sent = 0;
  let skipped = 0;

  for (const member of members ?? []) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", member.user_id)
      .maybeSingle();

    if (!profile?.email) {
      skipped += 1;
      continue;
    }

    const result = await sendAlertDigestEmail({
      to: profile.email,
      subject: digestTitle,
      html: summaryHtml,
    });

    await supabase.from("alert_delivery_log").insert({
      organization_id: organizationId,
      user_id: member.user_id,
      channel: "email",
      delivery_type: "digest",
      reference_id: digestId,
      status: result.ok ? "sent" : "skipped",
      error_message: result.ok ? null : result.reason,
      sent_at: result.ok ? new Date().toISOString() : null,
    });

    if (result.ok) {
      sent += 1;
    } else {
      skipped += 1;
    }
  }

  console.log("[jobs:digest:email]", {
    organizationId,
    digestId,
    dedupeKey,
    sent,
    skipped,
  });

  return { sent, skipped };
}
