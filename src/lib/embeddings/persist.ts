import type { SupabaseClient } from "@supabase/supabase-js";

import { embedTexts } from "@/lib/embeddings/client";
import {
  buildEntityEmbeddingChunks,
  buildEventEmbeddingChunks,
} from "@/lib/embeddings/chunk";
import type { EmbeddingChunk } from "@/lib/embeddings/types";
import type { Database } from "@/types/database";

type Db = SupabaseClient<Database>;

import { formatEmbeddingVector } from "@/lib/embeddings/format";

export type PersistEmbeddingsResult =
  | { ok: true; embedded: number; skipped: number }
  | { ok: false; reason: string };

async function upsertChunks(
  supabase: Db,
  organizationId: string,
  sourceType: "event" | "entity",
  sourceId: string,
  chunks: EmbeddingChunk[],
  vectors: number[][] | null,
): Promise<PersistEmbeddingsResult> {
  let embedded = 0;
  let skipped = 0;

  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const vector = vectors?.[i] ?? null;

    const row = {
      organization_id: organizationId,
      source_type: sourceType,
      source_id: sourceId,
      chunk_kind: chunk.kind,
      chunk_index: chunk.index,
      content: chunk.content,
      content_hash: chunk.contentHash,
      embedding: formatEmbeddingVector(vector),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("intelligence_embeddings").upsert(
      row,
      {
        onConflict:
          "organization_id,source_type,source_id,chunk_kind,chunk_index",
      },
    );

    if (error) {
      console.error("[embeddings:persist]", {
        sourceType,
        sourceId,
        chunkKind: chunk.kind,
        error: error.message,
      });
      return { ok: false, reason: error.message };
    }

    if (vector) {
      embedded += 1;
    } else {
      skipped += 1;
    }
  }

  return { ok: true, embedded, skipped };
}

export async function persistEventEmbeddings(
  supabase: Db,
  organizationId: string,
  eventId: string,
  input: {
    title: string;
    summary: string;
    implication?: string | null;
  },
): Promise<PersistEmbeddingsResult> {
  const chunks = buildEventEmbeddingChunks(input);
  if (chunks.length === 0) {
    return { ok: true, embedded: 0, skipped: 0 };
  }

  const embedResult = await embedTexts(chunks.map((c) => c.content));
  const vectors =
    embedResult.ok === true ? embedResult.vectors : null;

  if (!embedResult.ok) {
    console.log("[embeddings:persist:event]", {
      eventId,
      outcome: embedResult.reason,
      chunks: chunks.length,
    });
  }

  return upsertChunks(
    supabase,
    organizationId,
    "event",
    eventId,
    chunks,
    vectors,
  );
}

export async function persistEntityEmbeddings(
  supabase: Db,
  organizationId: string,
  entityId: string,
  input: {
    name: string;
    type: string;
    description?: string | null;
    domain?: string | null;
  },
): Promise<PersistEmbeddingsResult> {
  const chunks = buildEntityEmbeddingChunks(input);
  if (chunks.length === 0) {
    return { ok: true, embedded: 0, skipped: 0 };
  }

  const embedResult = await embedTexts(chunks.map((c) => c.content));
  const vectors =
    embedResult.ok === true ? embedResult.vectors : null;

  if (!embedResult.ok) {
    console.log("[embeddings:persist:entity]", {
      entityId,
      outcome: embedResult.reason,
      chunks: chunks.length,
    });
  }

  return upsertChunks(
    supabase,
    organizationId,
    "entity",
    entityId,
    chunks,
    vectors,
  );
}
