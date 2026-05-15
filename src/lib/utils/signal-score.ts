import type { EventType } from "@/modules/events/constants";
import { signalBand } from "@/modules/events/constants";

const EVENT_TYPE_WEIGHT: Record<EventType, number> = {
  pricing_change: 22,
  product_launch: 18,
  funding: 20,
  exec_move: 16,
  partnership: 14,
  hiring_surge: 12,
  market_expansion: 15,
  positioning_change: 10,
  compliance_security: 14,
  other: 4,
};

export type SignalScoreInput = {
  eventType: EventType;
  changeRatio: number;
  aiConfidence: number;
  isSignificant: boolean;
  detectedAt?: Date;
};

export type SignalScoreFactor = {
  label: string;
  contribution: number;
};

export type SignalScoreResult = {
  score: number;
  severity: ReturnType<typeof signalBand>;
  factors: SignalScoreFactor[];
};

function recencyBoost(detectedAt?: Date): number {
  if (!detectedAt) {
    return 0;
  }
  const hours =
    (Date.now() - detectedAt.getTime()) / (1000 * 60 * 60);
  if (hours <= 6) {
    return 8;
  }
  if (hours <= 24) {
    return 5;
  }
  if (hours <= 72) {
    return 2;
  }
  return 0;
}

/**
 * Deterministic signal score — explainable factors, no opaque model output.
 */
export function computeSignalScore(input: SignalScoreInput): SignalScoreResult {
  const factors: SignalScoreFactor[] = [];
  let score = 42;

  const typeWeight = EVENT_TYPE_WEIGHT[input.eventType] ?? EVENT_TYPE_WEIGHT.other;
  factors.push({ label: "Event type", contribution: typeWeight });
  score += typeWeight;

  const magnitude = Math.min(18, Math.round(input.changeRatio * 120));
  if (magnitude > 0) {
    factors.push({ label: "Change magnitude", contribution: magnitude });
    score += magnitude;
  }

  const confidenceBoost = Math.round(input.aiConfidence * 12);
  if (confidenceBoost > 0) {
    factors.push({ label: "Classification confidence", contribution: confidenceBoost });
    score += confidenceBoost;
  }

  const recency = recencyBoost(input.detectedAt);
  if (recency > 0) {
    factors.push({ label: "Recency", contribution: recency });
    score += recency;
  }

  if (!input.isSignificant) {
    factors.push({ label: "Low strategic significance", contribution: -15 });
    score -= 15;
  }

  const clamped = Math.min(100, Math.max(0, Math.round(score)));

  return {
    score: clamped,
    severity: signalBand(clamped),
    factors,
  };
}
