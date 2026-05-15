import { NextRequest, NextResponse } from "next/server";

import { runDueIngestionBatch } from "@/jobs/ingestion";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Secured cron entrypoint — Vercel Cron or Trigger.dev HTTP trigger.
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
  };

  const supabase = createSupabaseServiceClient();

  let orgIds: string[] = [];
  if (body.organizationId) {
    orgIds = [body.organizationId];
  } else {
    const { data, error } = await supabase
      .from("organizations")
      .select("id")
      .limit(50);

    if (error) {
      return NextResponse.json({ error: "Failed to list organizations" }, { status: 500 });
    }
    orgIds = data?.map((o) => o.id) ?? [];
  }

  const results = [];
  for (const organizationId of orgIds) {
    const summary = await runDueIngestionBatch(organizationId);
    results.push({ organizationId, ...summary });
  }

  return NextResponse.json({ data: results });
}
