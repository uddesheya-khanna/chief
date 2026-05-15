import type { SearchExplainFactors } from "@/lib/embeddings/types";

const RECENCY_HALF_LIFE_DAYS = 90;

export function recencyScore(detectedAtIso: string, nowMs = Date.now()): number {
  const detected = new Date(detectedAtIso).getTime();
  if (Number.isNaN(detected)) {
    return 0.3;
  }
  const daysSince = (nowMs - detected) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.min(1, 1 - daysSince / RECENCY_HALF_LIFE_DAYS));
}

export function signalScoreNormalized(score: number): number {
  return Math.max(0, Math.min(1, score / 100));
}

/** Source-type heuristic — primary sources rank above manual/debug. */
export function sourceQualityScore(sourceType: string): number {
  switch (sourceType) {
    case "website":
    case "sec":
      return 1;
    case "news":
    case "linkedin":
      return 0.85;
    case "job_board":
      return 0.75;
    case "manual":
      return 0.55;
    default:
      return 0.7;
  }
}

export type CompositeRankInput = {
  semanticSimilarity: number;
  keywordRank: number;
  signalScore: number;
  detectedAt: string;
  sourceType: string;
  entityImportance?: number;
  hasSemantic: boolean;
  hasKeyword: boolean;
};

/**
 * Blends vector similarity with operational signals — not raw cosine distance alone.
 * Weights shift toward keyword when semantic leg is unavailable.
 */
export function computeCompositeScore(input: CompositeRankInput): {
  finalScore: number;
  explain: SearchExplainFactors;
} {
  const semantic = input.hasSemantic
    ? Math.max(0, Math.min(1, input.semanticSimilarity))
    : 0;
  const keyword = input.hasKeyword
    ? Math.max(0, Math.min(1, input.keywordRank))
    : 0;
  const signal = signalScoreNormalized(input.signalScore);
  const recency = recencyScore(input.detectedAt);
  const sourceQuality = sourceQualityScore(input.sourceType);
  const entityBoost = Math.max(
    0,
    Math.min(1, (input.entityImportance ?? 0.5)),
  );

  const semanticWeight = input.hasSemantic ? 0.38 : 0;
  const keywordWeight = input.hasKeyword ? (input.hasSemantic ? 0.22 : 0.45) : 0;
  const remainder = 1 - semanticWeight - keywordWeight;

  const blended =
    semantic * semanticWeight +
    keyword * keywordWeight +
    signal * remainder * 0.35 +
    recency * remainder * 0.3 +
    sourceQuality * remainder * 0.2 +
    entityBoost * remainder * 0.15;

  const finalScore = Math.max(0, Math.min(1, blended));

  return {
    finalScore,
    explain: {
      semantic,
      keyword,
      signal,
      recency,
      sourceQuality,
      entityBoost,
    },
  };
}

/** Suppress near-duplicate hits in result list (same entity + high title overlap). */
export function dedupeSearchHits<
  T extends { eventId: string; entityId: string; title: string; finalScore: number },
>(hits: T[], maxResults: number): T[] {
  const kept: T[] = [];
  const seenEntityRecent = new Map<string, number>();

  for (const hit of hits.sort((a, b) => b.finalScore - a.finalScore)) {
    const entityCount = seenEntityRecent.get(hit.entityId) ?? 0;
    if (entityCount >= 3) {
      continue;
    }

    const isDuplicate = kept.some((k) => {
      if (k.entityId !== hit.entityId) {
        return false;
      }
      const a = k.title.toLowerCase();
      const b = hit.title.toLowerCase();
      return a === b || a.includes(b) || b.includes(a);
    });

    if (isDuplicate) {
      continue;
    }

    kept.push(hit);
    seenEntityRecent.set(hit.entityId, entityCount + 1);
    if (kept.length >= maxResults) {
      break;
    }
  }

  return kept;
}
