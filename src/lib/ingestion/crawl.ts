import { normalizePageContent } from "@/lib/ingestion/normalize";
import type { CrawlResult } from "@/lib/ingestion/types";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_CONTENT_CHARS = 120_000;
const USER_AGENT =
  "ChiefIngestion/1.0 (+https://chief.app; competitive intelligence monitoring)";

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function crawlViaFirecrawl(url: string): Promise<CrawlResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const fetchedAt = new Date();
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) {
      return {
        url,
        content: "",
        fetchedAt,
        success: false,
        statusCode: res.status,
        error: `Firecrawl HTTP ${res.status}`,
      };
    }

    const body = (await res.json()) as {
      success?: boolean;
      data?: { markdown?: string };
      error?: string;
    };

    const markdown = body.data?.markdown ?? "";
    if (!body.success || !markdown.trim()) {
      return {
        url,
        content: "",
        fetchedAt,
        success: false,
        error: body.error ?? "Firecrawl returned empty content",
      };
    }

    const content = normalizePageContent(markdown).slice(0, MAX_CONTENT_CHARS);
    return {
      url,
      content,
      fetchedAt,
      success: true,
      statusCode: 200,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Firecrawl request failed";
    return {
      url,
      content: "",
      fetchedAt,
      success: false,
      error: message,
    };
  }
}

async function crawlViaFetch(url: string, timeoutMs: number): Promise<CrawlResult> {
  const fetchedAt = new Date();
  try {
    const res = await fetchWithTimeout(url, timeoutMs);
    const statusCode = res.status;

    if (!res.ok) {
      return {
        url,
        content: "",
        fetchedAt,
        success: false,
        statusCode,
        error: `HTTP ${statusCode}`,
      };
    }

    const html = await res.text();
    const content = normalizePageContent(html).slice(0, MAX_CONTENT_CHARS);

    if (content.length < 40) {
      return {
        url,
        content: "",
        fetchedAt,
        success: false,
        statusCode,
        error: "Page content too short after normalization",
      };
    }

    return {
      url,
      content,
      fetchedAt,
      success: true,
      statusCode,
    };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? `Request timed out after ${timeoutMs}ms`
        : err instanceof Error
          ? err.message
          : "Fetch failed";
    return {
      url,
      content: "",
      fetchedAt,
      success: false,
      error: message,
    };
  }
}

/**
 * Fetch and normalize a page. Never throws — returns structured success/failure.
 */
export async function crawlPage(
  url: string,
  options?: { timeoutMs?: number; retryOnce?: boolean },
): Promise<CrawlResult> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retryOnce = options?.retryOnce ?? true;

  const firecrawl = await crawlViaFirecrawl(url);
  if (firecrawl?.success) {
    return firecrawl;
  }

  let result = await crawlViaFetch(url, timeoutMs);
  if (
    retryOnce &&
    !result.success &&
    result.error &&
    !result.error.includes("timed out")
  ) {
    await new Promise((r) => setTimeout(r, 500));
    result = await crawlViaFetch(url, timeoutMs);
  }

  return result;
}

export function buildEntitySourceUrl(
  domain: string | null,
  sourceType: "website" | "pricing_page",
): string | null {
  if (!domain?.trim()) {
    return null;
  }
  const host = domain.trim().replace(/^https?:\/\//, "").split("/")[0];
  if (!host) {
    return null;
  }
  const base = `https://${host}`;
  if (sourceType === "pricing_page") {
    return `${base}/pricing`;
  }
  return base;
}
