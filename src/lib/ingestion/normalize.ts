/**
 * Normalize fetched HTML/markdown into comparable plain text for diffing.
 */

const BLOCK_TAGS = /<\/?(p|div|li|h[1-6]|br|tr|section|article|header|footer)[^>]*>/gi;

export function normalizePageContent(raw: string): string {
  let text = raw;

  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  text = text.replace(/<header[\s\S]*?<\/header>/gi, " ");

  text = text.replace(BLOCK_TAGS, "\n");
  text = text.replace(/<[^>]+>/g, " ");

  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, " ");

  const lines = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);

  const deduped: string[] = [];
  for (const line of lines) {
    if (deduped[deduped.length - 1] !== line) {
      deduped.push(line);
    }
  }

  return deduped.join("\n").trim();
}

export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
