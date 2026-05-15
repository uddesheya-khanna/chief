import { NextRequest, NextResponse } from "next/server";

import {
  runCompetitorWatchDigest,
  runDailyDigestForOrganization,
  runWeeklyDigestForOrganization,
} from "@/jobs/digests";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Secured cron entrypoint for digest generation.
 * Header: Authorization: Bearer {CRON_SECRET}
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    organizationId?: string;
    mode?: "daily" | "weekly" | "competitor_watch";
  };

  const supabase = createSupabaseServiceClient();
  const mode = body.mode ?? "daily";

  let orgRows: { id: string; name: string }[] = [];
  if (body.organizationId) {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", body.organizationId)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    orgRows = [data];
  } else {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name")
      .limit(50);
    if (error) {
      return NextResponse.json(
        { error: "Failed to list organizations" },
        { status: 500 },
      );
    }
    orgRows = data ?? [];
  }

  const results = [];
  for (const org of orgRows) {
    let summary;
    if (mode === "weekly") {
      summary = await runWeeklyDigestForOrganization(org.id, org.name);
    } else if (mode === "competitor_watch") {
      summary = await runCompetitorWatchDigest(org.id, org.name);
    } else {
      summary = await runDailyDigestForOrganization(org.id, org.name);
    }
    results.push({ organizationId: org.id, mode, ...summary });
  }

  return NextResponse.json({ data: results });
}
