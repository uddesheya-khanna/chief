import type { IngestionSourceType } from "@/lib/ingestion/types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const BUCKET = "ingestion-snapshots";

function snapshotObjectPath(params: {
  organizationId: string;
  entityId: string;
  sourceType: IngestionSourceType;
  date: Date;
}): string {
  const stamp = params.date.toISOString().replace(/[:.]/g, "-");
  return `${params.organizationId}/${params.entityId}/${params.sourceType}/${stamp}.md`;
}

export async function storeSnapshot(params: {
  organizationId: string;
  entityId: string;
  sourceType: IngestionSourceType;
  content: string;
  date?: Date;
}): Promise<{ path: string; error?: string }> {
  const date = params.date ?? new Date();
  const path = snapshotObjectPath({
    organizationId: params.organizationId,
    entityId: params.entityId,
    sourceType: params.sourceType,
    date,
  });

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, params.content, {
    contentType: "text/plain",
    upsert: true,
  });

  if (error) {
    console.error("[ingestion:snapshot:store]", { path, message: error.message });
    return { path, error: error.message };
  }

  return { path };
}

export async function getLatestSnapshot(params: {
  organizationId: string;
  entityId: string;
  sourceType: IngestionSourceType;
}): Promise<{ path: string; content: string } | null> {
  const supabase = createSupabaseServiceClient();
  const prefix = `${params.organizationId}/${params.entityId}/${params.sourceType}`;

  const { data: listed, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(`${params.organizationId}/${params.entityId}/${params.sourceType}`, {
      limit: 100,
      sortBy: { column: "name", order: "desc" },
    });

  if (listError) {
    console.error("[ingestion:snapshot:list]", listError.message);
    return null;
  }

  if (!listed?.length) {
    return null;
  }

  const latest = listed
    .filter((f) => f.name.endsWith(".md"))
    .sort((a, b) => b.name.localeCompare(a.name))[0];

  if (!latest) {
    return null;
  }

  const path = `${prefix}/${latest.name}`;
  const { data, error } = await supabase.storage.from(BUCKET).download(path);

  if (error || !data) {
    console.error("[ingestion:snapshot:download]", error?.message);
    return null;
  }

  const content = await data.text();
  return { path, content };
}
