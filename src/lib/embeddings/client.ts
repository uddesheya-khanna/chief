import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
} from "@/lib/embeddings/types";

export type EmbedTextsResult =
  | { ok: true; vectors: number[][] }
  | { ok: false; reason: "missing_api_key" | "api_error" | "invalid_response" };

function isEmbeddingVector(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === EMBEDDING_DIMENSIONS &&
    value.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

/**
 * OpenAI embeddings via fetch — single import surface for external embedding API.
 * Returns empty vectors when OPENAI_API_KEY is unset (keyword-only search fallback).
 */
export async function embedTexts(texts: string[]): Promise<EmbedTextsResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" };
  }

  const inputs = texts.map((t) => t.trim()).filter(Boolean);
  if (inputs.length === 0) {
    return { ok: true, vectors: [] };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: inputs,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[embeddings:api]", {
        status: res.status,
        body: body.slice(0, 500),
      });
      return { ok: false, reason: "api_error" };
    }

    const json = (await res.json()) as {
      data?: { embedding?: number[]; index?: number }[];
    };

    const rows = json.data ?? [];
    if (rows.length !== inputs.length) {
      return { ok: false, reason: "invalid_response" };
    }

    const ordered = [...rows].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );
    const vectors: number[][] = [];
    for (const row of ordered) {
      if (!isEmbeddingVector(row.embedding)) {
        return { ok: false, reason: "invalid_response" };
      }
      vectors.push(row.embedding);
    }

    console.log("[embeddings:api]", {
      model: EMBEDDING_MODEL,
      count: vectors.length,
      outcome: "success",
    });

    return { ok: true, vectors };
  } catch (err) {
    console.error("[embeddings:api]", {
      outcome: "api_error",
      message: err instanceof Error ? err.message : "unknown",
    });
    return { ok: false, reason: "api_error" };
  }
}

export async function embedQuery(text: string): Promise<number[] | null> {
  const result = await embedTexts([text]);
  if (!result.ok) {
    return null;
  }
  return result.vectors[0] ?? null;
}
