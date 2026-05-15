export function formatEmbeddingVector(vector: number[] | null): string | null {
  if (!vector) {
    return null;
  }
  return `[${vector.join(",")}]`;
}
