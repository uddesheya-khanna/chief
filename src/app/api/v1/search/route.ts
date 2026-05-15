import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hybridIntelligenceSearch } from "@/lib/embeddings/search";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/modules/org/workspace-context";

const SearchBodySchema = z.object({
  q: z.string().min(1).max(500),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(25),
  min_signal_score: z.coerce.number().int().min(0).max(100).optional(),
});

export async function POST(req: NextRequest) {
  const orgSlug = req.headers.get("x-org-slug") ?? "";
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = SearchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const offset = (parsed.data.page - 1) * parsed.data.limit;
  const result = await hybridIntelligenceSearch(supabase, {
    organizationId: ctx.organization.id,
    query: parsed.data.q,
    limit: parsed.data.limit,
    offset,
    minSignalScore: parsed.data.min_signal_score,
  });

  return NextResponse.json({ data: result });
}
