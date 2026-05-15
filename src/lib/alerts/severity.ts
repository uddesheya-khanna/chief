export type AlertSeverity = "high" | "medium" | "low";

export function severityFromSignalScore(signalScore: number): AlertSeverity {
  if (signalScore >= 80) {
    return "high";
  }
  if (signalScore >= 50) {
    return "medium";
  }
  return "low";
}

export function severityRank(severity: AlertSeverity): number {
  if (severity === "high") {
    return 3;
  }
  if (severity === "medium") {
    return 2;
  }
  return 1;
}
