import { createHash } from "node:crypto";

import type { EmbeddingChunk, EmbeddingChunkKind } from "@/lib/embeddings/types";

const TITLE_MAX = 500;
const SUMMARY_CHUNK_MAX = 800;
const SUMMARY_MAX_CHUNKS = 3;
const IMPLICATION_MAX = 600;
const PROFILE_MAX = 1200;

export function hashChunkContent(content: string): string {
  return createHash("sha256").update(content.trim()).digest("hex").slice(0, 32);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
  const normalized = normalizeWhitespace(text);
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 1)}…`;
}

/** Deterministic paragraph splits for long summaries. */
function splitSummaryChunks(summary: string): string[] {
  const normalized = summary.trim();
  if (!normalized) {
    return [];
  }
  if (normalized.length <= SUMMARY_CHUNK_MAX) {
    return [normalizeWhitespace(normalized)];
  }

  const paragraphs = normalized
    .split(/\n{2,}|\.\s+(?=[A-Z])/)
    .map((p) => normalizeWhitespace(p))
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    const candidate = buffer ? `${buffer} ${paragraph}` : paragraph;
    if (candidate.length <= SUMMARY_CHUNK_MAX) {
      buffer = candidate;
      continue;
    }
    if (buffer) {
      chunks.push(buffer);
    }
    if (paragraph.length > SUMMARY_CHUNK_MAX) {
      for (let i = 0; i < paragraph.length; i += SUMMARY_CHUNK_MAX) {
        chunks.push(paragraph.slice(i, i + SUMMARY_CHUNK_MAX));
      }
      buffer = "";
    } else {
      buffer = paragraph;
    }
    if (chunks.length >= SUMMARY_MAX_CHUNKS) {
      break;
    }
  }

  if (buffer && chunks.length < SUMMARY_MAX_CHUNKS) {
    chunks.push(buffer);
  }

  return chunks.slice(0, SUMMARY_MAX_CHUNKS);
}

function pushChunk(
  out: EmbeddingChunk[],
  kind: EmbeddingChunkKind,
  content: string,
  index: number,
) {
  const trimmed = truncate(content, kind === "profile" ? PROFILE_MAX : TITLE_MAX);
  if (!trimmed) {
    return;
  }
  out.push({
    kind,
    index,
    content: trimmed,
    contentHash: hashChunkContent(trimmed),
  });
}

export function buildEventEmbeddingChunks(input: {
  title: string;
  summary: string;
  implication?: string | null;
}): EmbeddingChunk[] {
  const chunks: EmbeddingChunk[] = [];

  pushChunk(chunks, "title", input.title, 0);

  const summaryParts = splitSummaryChunks(input.summary);
  summaryParts.forEach((part, i) => {
    pushChunk(chunks, "summary", part, i);
  });

  if (input.implication?.trim()) {
    pushChunk(chunks, "implication", truncate(input.implication, IMPLICATION_MAX), 0);
  }

  return chunks;
}

export function buildEntityEmbeddingChunks(input: {
  name: string;
  type: string;
  description?: string | null;
  domain?: string | null;
}): EmbeddingChunk[] {
  const lines = [
    input.name,
    `Type: ${input.type}`,
    input.domain ? `Domain: ${input.domain}` : null,
    input.description?.trim() ? input.description.trim() : null,
  ].filter(Boolean) as string[];

  const content = lines.join("\n");
  const chunks: EmbeddingChunk[] = [];
  pushChunk(chunks, "profile", content, 0);
  return chunks;
}
