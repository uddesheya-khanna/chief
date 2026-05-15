import { z } from "zod";

import { ENTITY_TYPES, type EntityType } from "@/modules/entities/constants";
import { EVENT_TYPES, type EventType } from "@/modules/events/constants";

export const WORKSPACE_FEED_PAGE_SIZE = 25;

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

const optionalYmd = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
);

const workspaceFeedQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    entity_type: z.string().optional(),
    event_type: z.string().optional(),
    signal: z.string().optional(),
    from: optionalYmd,
    to: optionalYmd,
    dismissed: z.enum(["0", "1"]).optional(),
  })
  .transform((o) => {
    const entityRaw = splitCsv(o.entity_type);
    const entityTypes = entityRaw.filter((t): t is EntityType =>
      (ENTITY_TYPES as readonly string[]).includes(t),
    );

    const eventRaw = splitCsv(o.event_type);
    const eventTypes = eventRaw.filter((t): t is EventType =>
      (EVENT_TYPES as readonly string[]).includes(t),
    );

    const signalRaw = splitCsv(o.signal);
    const signalLevels = signalRaw
      .map((s) => signalLevelSchema.safeParse(s))
      .filter((r) => r.success)
      .map((r) => r.data);

    let dateFrom = o.from?.trim() ? o.from.trim() : null;
    let dateTo = o.to?.trim() ? o.to.trim() : null;
    if (dateFrom && dateTo && dateFrom > dateTo) {
      [dateFrom, dateTo] = [dateTo, dateFrom];
    }

    return {
      page: o.page,
      entityTypes,
      eventTypes,
      signalLevels,
      dateFrom,
      dateTo,
      includeDismissed: o.dismissed === "1",
    };
  });

export type WorkspaceFeedQuery = z.infer<typeof workspaceFeedQuerySchema>;

const defaultFeedQuery: WorkspaceFeedQuery = {
  page: 1,
  entityTypes: [],
  eventTypes: [],
  signalLevels: [],
  dateFrom: null,
  dateTo: null,
  includeDismissed: false,
};

export function parseWorkspaceFeedQuery(
  raw: Record<string, string | string[] | undefined>,
): WorkspaceFeedQuery {
  const pick = (key: string): string | undefined => {
    const v = raw[key];
    if (Array.isArray(v)) {
      return v[0];
    }
    return v;
  };

  const parsed = workspaceFeedQuerySchema.safeParse({
    page: pick("page"),
    entity_type: pick("entity_type"),
    event_type: pick("event_type"),
    signal: pick("signal"),
    from: pick("from"),
    to: pick("to"),
    dismissed: pick("dismissed"),
  });
  if (!parsed.success) {
    return defaultFeedQuery;
  }
  return parsed.data;
}

export function serializeWorkspaceFeedQuery(
  q: WorkspaceFeedQuery,
): string {
  const p = new URLSearchParams();
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
  if (q.dateFrom) {
    p.set("from", q.dateFrom);
  }
  if (q.dateTo) {
    p.set("to", q.dateTo);
  }
  if (q.includeDismissed) {
    p.set("dismissed", "1");
  }
  return p.toString();
}

export function clampWorkspaceFeedPage(
  query: WorkspaceFeedQuery,
  total: number,
): WorkspaceFeedQuery {
  if (total <= 0) {
    return query.page === 1 ? query : { ...query, page: 1 };
  }
  const totalPages = Math.max(
    1,
    Math.ceil(total / WORKSPACE_FEED_PAGE_SIZE),
  );
  if (query.page <= totalPages) {
    return query;
  }
  return { ...query, page: totalPages };
}
