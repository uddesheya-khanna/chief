export {
  embedQuery,
  embedTexts,
  type EmbedTextsResult,
} from "@/lib/embeddings/client";
export {
  buildEntityEmbeddingChunks,
  buildEventEmbeddingChunks,
  hashChunkContent,
} from "@/lib/embeddings/chunk";
export {
  persistEntityEmbeddings,
  persistEventEmbeddings,
  type PersistEmbeddingsResult,
} from "@/lib/embeddings/persist";
export {
  computeCompositeScore,
  dedupeSearchHits,
  recencyScore,
  signalScoreNormalized,
  sourceQualityScore,
} from "@/lib/embeddings/ranking";
export {
  hybridIntelligenceSearch,
  searchTrackedEntities,
  type HybridSearchParams,
  type HybridSearchResult,
} from "@/lib/embeddings/search";
export type {
  EmbeddingChunk,
  EmbeddingChunkKind,
  RankedSearchHit,
  SearchExplainFactors,
} from "@/lib/embeddings/types";
