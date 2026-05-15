import { z } from "zod";

import { ENTITY_TYPES, type EntityType } from "@/modules/entities/constants";
import { EVENT_TYPES, type EventType } from "@/modules/events/constants";

export const WORKSPACE_SEARCH_PAGE_SIZE = 25;

const signalLevelSchema = z.enum(["high", "medium", "low"]);

function splitCsv(raw: string | undefined): string[] {
  if (!raw || typeof raw !== "string") {
    return [];
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const workspaceSearchQuerySchema = z
  .object({
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    entity_type: z.string().optional(),
    event_type: z.string().optional(),
    signal: z.string().optional(),
    min_score: z.coerce.number().int().min(0).max(100).optional(),
  })
  .transform((o) => {
    const entityTypes = splitCsv(o.entity_type).filter((t): t is EntityType =>
      (ENTITY_TYPES as readonly string[]).includes(t),
    );
    const eventTypes = splitCsv(o.event_type).filter((t): t is EventType =>
      (EVENT_TYPES as readonly string[]).includes(t),
    );
    const signalLevels = splitCsv(o.signal)
      .map((s) => signalLevelSchema.safeParse(s))
      .filter((r) => r.success)
      .map((r) => r.data);

    let minSignalScore = o.min_score ?? null;
    if (minSignalScore == null && signalLevels.length === 1) {
      if (signalLevels[0] === "high") {
        minSignalScore = 80;
      } else if (signalLevels[0] === "medium") {
        minSignalScore = 50;
      }
    }

    return {
      query: (o.q ?? "").trim(),
      page: o.page,
      entityTypes,
      eventTypes,
      signalLevels,
      minSignalScore,
    };
  });

export type WorkspaceSearchQuery = z.infer<typeof workspaceSearchQuerySchema>;

const defaultSearchQuery: WorkspaceSearchQuery = {
  query: "",
  page: 1,
  entityTypes: [],
  eventTypes: [],
  signalLevels: [],
  minSignalScore: null,
};

export function parseWorkspaceSearchQuery(
  raw: Record<string, string | string[] | undefined>,
): WorkspaceSearchQuery {
  const pick = (key: string): string | undefined => {
    const v = raw[key];
    if (Array.isArray(v)) {
      return v[0];
    }
    return v;
  };

  const parsed = workspaceSearchQuerySchema.safeParse({
    q: pick("q"),
    page: pick("page"),
    entity_type: pick("entity_type"),
    event_type: pick("event_type"),
    signal: pick("signal"),
    min_score: pick("min_score"),
  });

  if (!parsed.success) {
    return defaultSearchQuery;
  }
  return parsed.data;
}

export function serializeWorkspaceSearchQuery(q: WorkspaceSearchQuery): string {
  const p = new URLSearchParams();
  if (q.query) {
    p.set("q", q.query);
  }
  if (q.page > 1) {
    p.set("page", String(q.page));
  }
  if (q.entityTypes.length) {
    p.set("entity_type", q.entityTypes.join(","));
  }
  if (q.eventTypes.length) {
    p.set("event_type", q.eventTypes.join(","));
  }
  if (q.signalLevels.length) {
    p.set("signal", q.signalLevels.join(","));
  }
  if (q.minSignalScore != null) {
    p.set("min_score", String(q.minSignalScore));
  }
  return p.toString();
}

export function workspaceSearchHref(orgSlug: string, qs?: string): string {
  const base = `/w/${orgSlug}/search`;
  return qs ? `${base}?${qs}` : base;
}
