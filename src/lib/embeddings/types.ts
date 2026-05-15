import { z } from "zod";

export const EMBEDDING_DIMENSIONS = 1536;
export const EMBEDDING_MODEL = "text-embedding-3-small";

export const embeddingChunkKindSchema = z.enum([
  "title",
  "summary",
  "implication",
  "profile",
]);

export type EmbeddingChunkKind = z.infer<typeof embeddingChunkKindSchema>;

export const embeddingSourceTypeSchema = z.enum(["event", "entity"]);

export type EmbeddingSourceType = z.infer<typeof embeddingSourceTypeSchema>;

export type EmbeddingChunk = {
  kind: EmbeddingChunkKind;
  index: number;
  content: string;
  contentHash: string;
};

export type SearchExplainFactors = {
  semantic: number;
  keyword: number;
  signal: number;
  recency: number;
  sourceQuality: number;
  entityBoost: number;
};

export type RankedSearchHit = {
  eventId: string;
  entityId: string;
  title: string;
  summary: string;
  implication: string | null;
  signalScore: number;
  eventType: string;
  detectedAt: string;
  sourceType: string;
  entityName: string;
  entityType: string;
  finalScore: number;
  explain: SearchExplainFactors;
  matchKinds: ("semantic" | "keyword")[];
};
