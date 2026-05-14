# Implementation Roadmap

> This document defines the sequencing strategy for building this platform. It is not a project management tool — use Linear for that. It is an architectural guide that answers: "what should we build next, in what order, with what constraints, and what should we deliberately not build yet?"
>
> The governing philosophy is vertical slices, correctness first, no speculative infrastructure. We build one thing fully before we build the next thing partially.

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Implementation Sequencing Philosophy](#2-implementation-sequencing-philosophy)
3. [Phase 0 — Foundation](#phase-0--foundation)
4. [Phase 1 — Entities](#phase-1--entities)
5. [Phase 2 — Intelligence Events](#phase-2--intelligence-events)
6. [Phase 3 — Feed System](#phase-3--feed-system)
7. [Phase 4 — Ingestion Pipelines](#phase-4--ingestion-pipelines)
8. [Phase 5 — AI Summarization](#phase-5--ai-summarization)
9. [Phase 6 — Monitoring Rules](#phase-6--monitoring-rules)
10. [Phase 7 — Reports](#phase-7--reports)
11. [Phase 8 — Search](#phase-8--search)
12. [Phase 9 — Alerts](#phase-9--alerts)
13. [Phase 10 — Intelligence Layer](#phase-10--intelligence-layer)
14. [Phase 11 — Workflow Automation](#phase-11--workflow-automation)
15. [Phase 12 — Scaling Phase](#phase-12--scaling-phase)
16. [Cross-Phase Constraints](#cross-phase-constraints)
17. [What We Deliberately Defer](#what-we-deliberately-defer)

---

## 1. Current State Assessment

### What Is Real

The following systems are production-real — they exist as functional code, not scaffolding:

- **Authentication** — Supabase Auth with email/password. Login and signup flows complete. Session management working. JWT with org_id claim.
- **Organizations / Workspaces** — Multi-tenant foundation. Org table, org context in middleware, RLS policies on core tables. Org switcher in UI shell.
- **Modular Monolith Architecture** — Route groups `(auth)` and `(app)` established. `lib/supabase/` properly abstracted. Folder structure matches conventions.md.
- **Design Tokens** — CSS variables for color, typography, spacing. Geist font loaded. Base design system applied.
- **App Shell** — Sidebar, top navigation, layout wrapper. Route-based active state detection. Responsive shell structure.
- **Tracked Entities System** — Schema exists. Basic CRUD Server Actions. Entity list page renders real data.
- **Server-Driven Architecture** — Server Components are the default. Pattern is established and consistent.

### What Is Scaffolded (Not Yet Real)

The following exist as structural placeholders — routes exist, pages render, but data is mocked or empty:

- Intelligence events — schema exists, no data
- Feed — UI shell exists, no real data flowing through it
- Monitoring rules — schema exists, no rule execution
- Ingestion pipelines — lib structure exists, no actual crawling or processing
- AI pipelines — directory exists, no functional pipeline calls
- Reports — route exists, no generation logic
- Alerts — schema exists, no dispatch logic
- Search — page exists, no search implementation
- Embeddings — lib file exists, no embedding generation or storage

### Architectural Integrity Assessment

The foundation is sound. The following constraints must be preserved as we build:

- RLS is active and correct on existing tables — maintain this on every new table
- Server Components remain the default — no pattern drift toward client-side fetching
- Supabase client access is fully contained in `lib/supabase/` — no direct SDK imports elsewhere
- Domain boundaries in `lib/` are clean — maintain them

---

## 2. Implementation Sequencing Philosophy

### Vertical Slices

We build features as vertical slices through all layers — database, business logic, background jobs, and UI — before moving to the next feature. We do not build all database schemas, then all backend logic, then all UI. We build one complete, functional capability at a time.

**Why:** A half-built system has no users. A fully-built narrow system can be used, tested with real users, and iterated. Feedback on real behavior is more valuable than any amount of upfront design.

### Correctness First

A feature that works correctly for 100% of its intended scope is better than a feature that works approximately for 200% of it. We define the scope narrowly, implement it correctly, and expand scope in the next iteration.

"Correct" means:
- Edge cases are handled (empty state, error state, race conditions)
- Data is accurate and consistent
- The UX communicates failures clearly
- The code is maintainable — someone can read it and understand what it does

### The Exit Criteria Test

Before declaring a phase complete, answer: "Can a real user, with real data, use this feature to accomplish a real task without hitting a wall?" If the answer is no, the phase is not complete.

### Anti-Patterns in Sequencing

**❌ Building for scale before you have scale problems.** No message queues, no read replicas, no CDN for assets until specific, measured bottlenecks require them.

**❌ Building the configuration UI before the core behavior.** Monitoring rules UI comes after monitoring rules work. Alert preferences UI comes after alerts send.

**❌ Building integrations before the core product is stable.** Slack integration, Salesforce integration, API access — these are Phase 11+. They require a stable core product surface to integrate with.

**❌ Building for "future flexibility" that adds present complexity.** Every abstraction is a bet. Don't abstract for futures that might not arrive.

---

## Phase 0 — Foundation

**Status: Complete.**

### What Was Built

- Supabase project with Auth, Postgres, Storage, RLS enabled
- Next.js 14 App Router with TypeScript, Tailwind v4, shadcn/ui
- Route groups `(auth)` and `(app)` with correct layout hierarchy
- `lib/supabase/server.ts` and `lib/supabase/client.ts` — the only Supabase access points
- Middleware: session validation, org context injection
- Design tokens: CSS variables, font loading, base reset
- App shell: sidebar, topnav, org switcher
- Supabase CLI configured, local dev working, migration workflow established
- `types/database.ts` auto-generation working
- Vercel deployment configured (staging + production environments)
- `.cursorrules` file with architectural context
- This documentation set

### Foundation Invariants

These are true and must remain true:

- Every authenticated route validates org context in middleware before rendering
- Every table with org-scoped data has RLS policies active
- `supabase gen types typescript` runs in CI on every migration
- Staging environment exists and is always deployable

---

## Phase 1 — Entities

**Status: Substantially complete. Polish and completeness pass required.**

### Goals

A user can add, view, edit, deactivate, and understand tracked entities. The entity system is the foundation everything else is built on.

### What "Complete" Means

- Create entity wizard: name, type (competitor/investor/partner/market/executive), domain, optional description
- Entity list page: all active entities, filterable by type, sortable by name/created_at
- Entity detail page: header (name, type, domain, status), tab structure (Timeline | Signals | Settings)
- Edit entity: name, description, domain, status (active/paused)
- Deactivate entity (soft delete — sets `is_active = false`)
- Empty states for all views
- Loading skeletons for all async states
- Entity type badges with consistent color coding

### Schema Requirements

```sql
-- Already exists, verify these columns are present and typed correctly:
tracked_entities:
  id uuid PK
  org_id uuid FK → organizations
  type text CHECK (type IN ('competitor','investor','partner','market','executive'))
  name text NOT NULL
  domain text
  description text
  metadata jsonb DEFAULT '{}'
  is_active boolean DEFAULT true
  created_by uuid FK → users
  created_at timestamptz DEFAULT now()
  updated_at timestamptz DEFAULT now()

-- Add if missing:
-- updated_at trigger (update on any row change)
-- index on (org_id, type, is_active)
-- index on (org_id, created_at DESC)
```

### Architectural Constraints

- Entity CRUD goes through Server Actions in `actions/entities.ts`
- No client-side Supabase calls for entity mutations
- Entity list page is a Server Component with data fetched at page level
- Entity detail page uses Suspense for the timeline tab (it will be the slow part when events exist)

### What Remains

- [ ] Edit entity form (currently missing or incomplete)
- [ ] Deactivate/reactivate action with confirmation
- [ ] Entity detail page — timeline tab renders real data (currently empty)
- [ ] Entity detail page — signals tab renders real data (currently empty)
- [ ] Loading skeletons for entity list and detail
- [ ] Empty states for all entity views
- [ ] `updated_at` trigger migration if missing

### Anti-Patterns to Avoid

- Do not build entity relationship visualization yet — that is Phase 10
- Do not build bulk entity import — that is not a priority until post-V1
- Do not add analytics or "entity health score" to entity detail — keep it simple

---

## Phase 2 — Intelligence Events

**Status: Schema exists. No real events. This phase makes events real.**

### Goals

Intelligence events are the core data unit of the product. This phase establishes the event storage, retrieval, and display patterns that all subsequent phases depend on.

### What "Complete" Means

- `intelligence_events` table is production-ready (all columns, all indexes, RLS)
- Server Actions for dismissing events, changing signal score (manual override)
- Event detail view: full content, source link, AI summary, implication, metadata
- Events are displayed correctly in the entity detail timeline tab
- Manual event creation (admin/debug only — for testing without real ingestion)

### Schema Requirements

```sql
intelligence_events:
  id uuid PK
  org_id uuid FK → organizations
  entity_id uuid FK → tracked_entities
  source_url text
  source_type text CHECK (source_type IN ('website','news','job_board','linkedin','sec','manual'))
  event_type text CHECK (event_type IN ('pricing_change','product_launch','hiring_surge','funding','exec_move','partnership','other'))
  title text NOT NULL
  summary text NOT NULL
  implication text
  raw_content text
  signal_score integer DEFAULT 50 CHECK (signal_score >= 0 AND signal_score <= 100)
  metadata jsonb DEFAULT '{}'
  is_dismissed boolean DEFAULT false
  dismissed_at timestamptz
  dismissed_by uuid FK → users
  detected_at timestamptz DEFAULT now()
  published_at timestamptz
  created_at timestamptz DEFAULT now()

-- Required indexes:
CREATE INDEX idx_events_org_detected ON intelligence_events(org_id, detected_at DESC);
CREATE INDEX idx_events_entity ON intelligence_events(entity_id, detected_at DESC);
CREATE INDEX idx_events_org_score ON intelligence_events(org_id, signal_score DESC);
CREATE INDEX idx_events_org_type ON intelligence_events(org_id, event_type, detected_at DESC);
CREATE INDEX idx_events_org_dismissed ON intelligence_events(org_id, is_dismissed, detected_at DESC);
```

### Data Contract

Every intelligence event must have at minimum:
- `title` — specific, not generic. "Acme raised pricing on the Pro tier by 20%" not "Pricing update"
- `summary` — 2-3 sentences of factual summary
- `source_url` — the original source (not an intermediary)
- `entity_id` — always linked to a tracked entity
- `signal_score` — always computed, never null

### What to Mock Initially

In this phase, events are seeded manually via seed scripts or a debug creation form. The feed and entity timeline use real event data, even if that data is hand-crafted. This is correct — it lets us build and validate the display layer before ingestion is wired up.

### Anti-Patterns

- Do not add a `relevance_score` separate from `signal_score` yet — one score to start
- Do not add a `tags` array yet — event_type is sufficient categorization initially
- Do not build event deduplication logic in this phase — that is Phase 4

---

## Phase 3 — Feed System

**Status: UI shell exists. This phase makes it real.**

### Goals

The intelligence feed is the product's primary surface. It must be excellent. This phase makes the feed fully functional with real data, filtering, pagination, and the correct interaction model.

### What "Complete" Means

- Feed page displays real `intelligence_events`, sorted by `detected_at DESC`
- Signal cards render: entity name, event type badge, title, summary excerpt, implication excerpt, source, timestamp
- Signal level is communicated via left border color (emerald/amber/none)
- Filter controls: entity type (multi-select), event type (multi-select), signal level (high/medium/all), date range
- Filter state persists in URL (survives refresh, is shareable)
- Pagination: 25 items per page, previous/next navigation (not infinite scroll)
- Dismiss action: mark event as dismissed, remove from feed immediately (optimistic), restore via undo toast
- Open action: opens source URL in new tab
- Save/bookmark action: saves event to a named collection (Phase 10 — for now, just a bookmark state)
- Feed skeleton while loading
- Empty state when no signals match filters
- "N new signals" banner when new events arrive (via polling — not WebSocket yet)

### Filter Implementation

Filters are URL state, not component state:

```typescript
// app/(app)/feed/page.tsx
export default async function FeedPage({ searchParams }) {
  const filters = parseFeedFilters(searchParams) // Zod validated
  const events = await getIntelligenceEvents(filters)
  return <IntelligenceFeed events={events} filters={filters} />
}
```

```typescript
// components/feed/feed-filters.tsx
'use client'
export function FeedFilters({ currentFilters }) {
  const router = useRouter()
  const pathname = usePathname()

  function updateFilter(key: string, value: string | string[]) {
    const params = new URLSearchParams(window.location.search)
    // update params
    router.push(`${pathname}?${params.toString()}`)
  }
  // render filter UI
}
```

### Performance Requirements

- Feed initial load must render within 1.5s for up to 500 total events per org
- Filter changes must re-render within 800ms (server component re-render via URL change)
- Pagination must not re-fetch the entire dataset — use OFFSET/LIMIT with a count query

### New Signal Polling

Every 90 seconds, check if `count(*)` of events newer than the most recently displayed event has changed. If yes, show the "N new signals" banner. Do not auto-inject events into the feed while the user is reading. This is conservative and correct.

### Anti-Patterns

- Do not implement real-time WebSocket feed updates in this phase — polling is correct here
- Do not add complex saved filter management (named filter sets) in this phase
- Do not add AI-powered feed personalization in this phase
- Do not add keyboard shortcuts in this phase — add them in a polish pass after the feed is stable

---

## Phase 4 — Ingestion Pipelines

**Status: lib structure exists. No actual crawling or processing occurs.**

### Goals

Real intelligence events are generated from real monitored sources. This phase makes the product actually watch the market.

### What "Complete" Means

**Minimum viable ingestion (MVP of this phase):**
- Website monitoring: crawl a tracked entity's domain and `/pricing` page on a schedule
- Detect meaningful content changes (not CSS/nav changes)
- Create an `ingestion_jobs` table entry for every run
- Store page snapshots to Supabase Storage
- Diff fetched content against previous snapshot
- Log result: `new_content | no_change | error`

**This phase does NOT include AI processing** — raw diffs are stored, not summarized yet. The AI layer is Phase 5.

### Infrastructure Requirements

Trigger.dev must be set up and functional before this phase:
- Account created
- Project configured
- Local dev Trigger.dev connection working
- At least one test job running successfully

### Ingestion Job Schema

```sql
ingestion_jobs:
  id uuid PK
  org_id uuid FK → organizations
  entity_id uuid FK → tracked_entities
  rule_id uuid FK → monitoring_rules (nullable in early phase)
  source_type text NOT NULL
  source_url text NOT NULL
  status text DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','skipped'))
  result_type text CHECK (result_type IN ('new_content','no_change','error','skipped_duplicate'))
  raw_content text
  snapshot_path text  -- Supabase Storage path
  previous_snapshot_path text
  diff_summary text
  error_message text
  started_at timestamptz
  completed_at timestamptz
  created_at timestamptz DEFAULT now()

-- Indexes:
CREATE INDEX idx_jobs_org_status ON ingestion_jobs(org_id, status, created_at DESC);
CREATE INDEX idx_jobs_entity ON ingestion_jobs(entity_id, created_at DESC);
```

### Crawl Implementation

```typescript
// lib/ingestion/crawl.ts
export async function crawlPage(url: string): Promise<CrawlResult> {
  // Use Firecrawl
  // Return: { url, content: string (markdown), fetchedAt, success, error? }
  // Never throw — return success: false with error message
  // Timeout: 30 seconds maximum
  // Retry: once on network error, not on 4xx
}
```

### Snapshot Storage Pattern

```typescript
// lib/ingestion/snapshot.ts
export async function storeSnapshot(params: {
  orgId: string
  entityId: string
  sourceType: string
  content: string
  date: Date
}): Promise<string> {
  // Returns storage path
  // Path: ingestion-snapshots/{orgId}/{entityId}/{sourceType}/{YYYY-MM-DD-HH}.md
}

export async function getLatestSnapshot(params: {
  orgId: string
  entityId: string
  sourceType: string
}): Promise<{ path: string; content: string } | null> {
  // Returns the most recent snapshot for this entity+source combination
}
```

### Diff Logic

We diff cleaned, normalized content — not raw HTML. The diff threshold for "meaningful change" is tunable:

```typescript
// lib/ingestion/diff.ts
export function computeDiff(previous: string, current: string): DiffResult {
  // Returns: { hasMeaningfulChange, changeRatio, additions: string[], removals: string[] }
  // hasMeaningfulChange = true if:
  //   - changeRatio > 0.05 (more than 5% of content changed)
  //   - OR additions contain pricing-related keywords
  //   - OR removals contain pricing-related keywords
}
```

### Scheduling (Phase 4 defaults)

- Website monitoring: every 24 hours per entity
- Pricing page: every 12 hours (more frequent — pricing changes are high signal)
- Maximum concurrent crawls: 3 per org (to avoid rate limiting target domains)

The schedule is hardcoded in this phase. User-configurable schedules come in Phase 6.

### Anti-Patterns

- Do not implement news monitoring (Exa/Serper) in this phase — start with website crawling only
- Do not implement job board monitoring in this phase
- Do not implement LinkedIn monitoring in this phase
- Do not process the diff with AI in this phase — store it and move to Phase 5
- Do not build the monitoring rules UI in this phase — rules are hardcoded to "website + pricing page per entity"

---

## Phase 5 — AI Summarization

**Status: lib/ai/ directory exists with placeholder files. No functional AI calls.**

### Goals

Raw content diffs from Phase 4 are processed into structured intelligence events with titles, summaries, and strategic implications.

### What "Complete" Means

- `lib/ai/claude.ts` — Anthropic SDK wrapper functional and tested
- `classifyEvent` pipeline: takes diff content, returns event_type + is_significant + confidence
- `summarizeEvent` pipeline: takes classified content, returns title + summary + key_facts
- `generateImplication` pipeline: takes summary + org context, returns strategic implication
- Zod schemas for all AI outputs
- Error handling: parse failures log and return safe defaults, never crash the job
- Intelligence events are created in the database from real AI-processed ingestion results

### Pipeline Sequence

The AI processing runs after ingestion, in the same Trigger.dev job:

```
ingestion_job.completed (result_type = 'new_content')
  → classify_event(diff_content, entity_context)
  → if not is_significant: mark job as skipped_ai, done
  → summarize_event(diff_content, entity_context, event_type)
  → generate_implication(summary, org_context)
  → compute_signal_score(event_type, entity_importance, confidence)
  → insert intelligence_event
  → trigger alert evaluation (Phase 9)
```

### Org Context for Implications

The implication prompt receives org context to make implications specific:

```typescript
interface OrgContext {
  productDescription: string  // pulled from org settings
  market: string
  stage: string               // seed | series-a | series-b | growth
  topCompetitors: string[]    // names of their tracked competitors
}
```

This context is fetched from `organizations.settings` jsonb column. If not set (early users), implication is generated without context (generic but still useful).

### Prompt Quality Standards

Before a prompt is committed to `lib/ai/prompts/`, it must be tested against at least 10 real content samples. Prompts are iterated until:
- Classification accuracy is > 85% on the test set
- Summaries are specific (reference the actual content), not generic
- Implications reference the user's competitive context, not generic strategic advice

### Cost Awareness

Track estimated token usage per pipeline run:
- classify: ~500 tokens in, ~150 tokens out (haiku) → ~$0.0002 per run
- summarize: ~2000 tokens in, ~500 tokens out (sonnet) → ~$0.003 per run
- implication: ~1000 tokens in, ~200 tokens out (sonnet) → ~$0.0015 per run

At 100 ingestion runs/day per org with 30% meaningful changes: ~$0.15/day/org in AI costs. This is acceptable and should be monitored.

### Anti-Patterns

- Do not build a "universal prompt manager" or "prompt engineering UI" — prompts are code
- Do not attempt streaming responses in pipeline code
- Do not run multiple AI calls in parallel within a single pipeline — run them sequentially for debuggability
- Do not add "chain of thought" reasoning visible to users — internal reasoning stays internal
- Do not build a user-facing "AI confidence" display — confidence is used internally for routing, not displayed

---

## Phase 6 — Monitoring Rules

**Status: Schema exists. No rule execution. Rules are currently hardcoded in the ingestion job.**

### Goals

Users can define what they want to monitor, how frequently, and from which sources. The system executes monitoring rules on a schedule.

### What "Complete" Means

- `monitoring_rules` table is production-ready
- Default rules auto-created when a new entity is added (website monitoring, pricing page)
- Rule list UI per entity (visible in entity detail Settings tab)
- Enable/disable rules per entity
- Rule frequency options: daily (default), twice daily, weekly
- Monitoring rules are the scheduling input to the Trigger.dev ingestion job
- Run history per rule: last run, result, next scheduled run

### Schema Requirements

```sql
monitoring_rules:
  id uuid PK
  org_id uuid FK → organizations
  entity_id uuid FK → tracked_entities
  rule_type text CHECK (rule_type IN ('website_change','pricing_page','news_search','job_board'))
  config jsonb NOT NULL
  -- website_change config: { url: string, selector?: string }
  -- pricing_page config: { url: string }
  -- news_search config: { query: string, domains?: string[] }
  -- job_board config: { company_name: string, roles?: string[] }
  frequency text DEFAULT 'daily' CHECK (frequency IN ('hourly','twice_daily','daily','weekly'))
  is_active boolean DEFAULT true
  last_run_at timestamptz
  last_result_type text
  next_run_at timestamptz
  created_at timestamptz DEFAULT now()

-- Indexes:
CREATE INDEX idx_rules_org_active ON monitoring_rules(org_id, is_active);
CREATE INDEX idx_rules_next_run ON monitoring_rules(next_run_at) WHERE is_active = true;
```

### Auto-Created Default Rules

When `createEntity` Server Action is called:

```typescript
// Automatically after entity creation:
await createDefaultRules(entityId, orgId, {
  domain: entity.domain,
  name: entity.name
})

// Creates:
// 1. website_change rule for entity.domain (daily)
// 2. pricing_page rule for entity.domain/pricing (twice_daily)
// 3. news_search rule for entity.name (daily) — Phase 4b, after news monitoring is built
```

### The Scheduler Query

The Trigger.dev scheduled job runs every 15 minutes:

```sql
SELECT * FROM monitoring_rules
WHERE is_active = true
  AND next_run_at <= NOW()
ORDER BY next_run_at ASC
LIMIT 50;
```

For each rule returned, enqueue an ingestion job. Update `last_run_at` and `next_run_at` immediately (before the job runs — prevents double-scheduling).

### Anti-Patterns

- Do not build custom rule types (user-defined scraping logic) — stick to the four defined rule types
- Do not build rule scheduling UI with a cron expression editor — use frequency presets
- Do not implement rule testing/preview UI in this phase

---

## Phase 7 — Reports

**Status: Route exists. No generation logic.**

### Goals

The product generates weekly intelligence briefings and allows users to generate ad-hoc entity snapshots. Reports are the primary deliverable of the intelligence layer.

### What "Complete" Means

**Weekly briefing (automated):**
- Generated every Monday at 6am org-local-time (if we don't have timezone: UTC)
- Covers the past 7 days of intelligence events
- Structure: Executive Summary, Top Signals (top 5 by score), Entity Activity Summary, Recommended Actions
- Stored as structured JSON in `reports.content`
- Rendered as a styled, readable report page in the app
- Accessible from the Reports section

**Entity snapshot (on-demand):**
- User triggers from entity detail page
- Covers all signals for that entity, grouped by event type
- Same JSON structure as weekly briefing but entity-scoped
- Generates in <30 seconds (background job with polling or WebSocket status)

### Report Schema

```sql
reports:
  id uuid PK
  org_id uuid FK → organizations
  title text NOT NULL
  type text CHECK (type IN ('weekly_briefing','entity_snapshot','custom'))
  status text DEFAULT 'generating' CHECK (status IN ('generating','complete','failed'))
  content jsonb
  -- Structure:
  -- {
  --   executive_summary: string,
  --   top_signals: EventSummary[],
  --   entity_summaries: { entityId: string, name: string, signal_count: number, highlights: string[] }[],
  --   recommended_actions: string[],
  --   metadata: { entity_ids: string[], event_ids: string[], period_start: string, period_end: string }
  -- }
  entity_ids uuid[] DEFAULT '{}'
  event_ids uuid[] DEFAULT '{}'
  generated_by text DEFAULT 'system'  -- 'system' | user_id
  created_at timestamptz DEFAULT now()
  completed_at timestamptz

-- Indexes:
CREATE INDEX idx_reports_org_type ON reports(org_id, type, created_at DESC);
```

### Report Generation Pipeline

```typescript
// jobs/reports.ts
export const generateWeeklyBriefing = task({
  id: 'generate-weekly-briefing',
  run: async ({ orgId }: { orgId: string }) => {
    // 1. Fetch top 20 events from past 7 days, ordered by signal_score DESC
    // 2. Fetch entity summaries for all active entities
    // 3. Call generateBriefing() pipeline in lib/ai/pipelines/generate-briefing.ts
    // 4. Store structured result in reports table
    // 5. Update status to 'complete'
    // 6. Trigger alert if configured (Phase 9)
  }
})
```

### Report Rendering

Reports render from the stored JSON structure — they are not re-generated on each view. The renderer is a React Server Component that takes `report.content` and renders styled HTML.

### Anti-Patterns

- Do not generate reports on-demand synchronously — always background job with status polling
- Do not build report "templates" or report builder UI in this phase
- Do not add export (PDF/CSV) in this phase — add in a polish pass after reports are stable
- Do not add report sharing (public links) in this phase

---

## Phase 8 — Search

**Status: Search page exists. No search implementation.**

### Goals

Users can search across all intelligence events using natural language. Search results are ranked by relevance and recency.

### What "Complete" Means

- Semantic search over `intelligence_events` using pgvector
- Results ranked by cosine similarity × recency weight
- Search results page: same signal card UI as feed, with relevance score shown
- Query is echoed back to the user ("Showing results for 'competitor pricing changes'")
- No results state with clear messaging
- Search latency < 800ms for up to 10,000 events

### Embedding Infrastructure

```sql
-- Add to intelligence_events:
ALTER TABLE intelligence_events ADD COLUMN embedding vector(1536);

CREATE INDEX ON intelligence_events USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

Embeddings are generated when an event is created (in the same Trigger.dev job, after AI summarization). Not in the main request path.

```typescript
// lib/embeddings/index.ts
export async function embedEvent(event: Pick<IntelligenceEvent, 'title' | 'summary' | 'implication'>): Promise<number[]> {
  // Embeds: title + " " + summary + " " + implication
  // Model: text-embedding-3-small (1536 dimensions)
  // Returns the embedding vector
}

export async function searchEvents(params: {
  orgId: string
  query: string
  limit?: number
  minScore?: number
}): Promise<IntelligenceEvent[]> {
  // 1. Embed the query
  // 2. Run pgvector cosine similarity search scoped to org_id
  // 3. Apply recency weight: final_score = (0.7 * similarity) + (0.3 * recency_score)
  // 4. Return top N results
}
```

### Recency Weighting

```typescript
function recencyScore(detectedAt: Date): number {
  const daysSince = (Date.now() - detectedAt.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, 1 - (daysSince / 90)) // linear decay over 90 days
}
```

### Anti-Patterns

- Do not build a "chat with your intelligence" feature in this phase — search is sufficient
- Do not implement hybrid BM25 + vector search unless query latency is measurably poor
- Do not add search filters in this phase — add them in a search polish pass
- Do not index content older than 6 months — set a rolling window

---

## Phase 9 — Alerts

**Status: Schema exists. No dispatch logic.**

### Goals

Users receive alerts when high-signal events occur. Alerts reach users through the channels they configure.

### What "Complete" Means

- In-app alert center: list of triggered alerts, dismiss, mark read
- Email alerts via Resend: triggered when `signal_score >= threshold`
- Alert preferences: per-user, per-entity-type threshold setting
- Alert frequency controls: immediate, daily digest, weekly digest
- Alert history: log of all dispatched alerts with delivery status
- Unread alert count in sidebar

### Alert Rules Schema

```sql
alert_preferences:
  id uuid PK
  user_id uuid FK → users
  org_id uuid FK → organizations
  entity_type text  -- null = applies to all entity types
  min_signal_score integer DEFAULT 75
  frequency text DEFAULT 'immediate' CHECK (frequency IN ('immediate','daily_digest','weekly_digest'))
  channels text[] DEFAULT '{in_app,email}'
  is_active boolean DEFAULT true
  created_at timestamptz DEFAULT now()

alert_history:
  id uuid PK
  org_id uuid FK → organizations
  user_id uuid FK → users
  event_id uuid FK → intelligence_events
  channel text NOT NULL
  status text DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','dismissed'))
  sent_at timestamptz
  error_message text
  created_at timestamptz DEFAULT now()
```

### Alert Dispatch Flow

```
intelligence_event created with signal_score >= 80
  → evaluate alert preferences for all users in org
  → for each user where event matches their preference:
      → if frequency = 'immediate': enqueue dispatch job
      → if frequency = 'daily_digest': add to daily digest queue
      → if frequency = 'weekly_digest': add to weekly digest queue

dispatch job:
  → send email via Resend (if email channel configured)
  → create in_app alert record
  → update alert_history status
```

### Default Alert Configuration

New users get: immediate alerts for signal_score >= 80, email + in-app, all entity types. This is the right default — high-value only, all channels. Users can tune down.

### Anti-Patterns

- Do not build Slack alerts in this phase — email + in-app is sufficient for V1
- Do not build webhook-based alerts in this phase
- Do not build alert rules with complex conditions (keyword matching, source filtering) in this phase
- Do not build alert grouping (combine related alerts into one email) in this phase

---

## Phase 10 — Intelligence Layer

**Status: Not started. Depends on Phases 1-9 being stable.**

### Goals

The product moves from displaying intelligence to synthesizing intelligence. This phase adds the higher-order intelligence capabilities that differentiate the product.

### Subsystems

**Entity Relationship Graph (lightweight):**
- Manual relationship definition: "Acme competes with Bazco"
- Automatically suggested relationships (two companies appear in the same signal frequently)
- Simple graph visualization on entity detail page (not a full graph database — just the `entity_relationships` table)

**Trending Signals:**
- Detect when a tracked entity has significantly more signal activity than its 30-day baseline
- Surface "trending" entity badge on entity cards and in the sidebar
- Logic: rolling 7-day signal count > 2x rolling 30-day weekly average

**Signal Pattern Detection:**
- When 3+ competitors show the same event type in the same week, surface a "market movement" signal
- Example: "3 of your tracked competitors made pricing changes this week"
- This is a generated meta-event, stored as a special event_type = 'market_movement'

**Executive Dashboard Refinement:**
- The dashboard gets a "strategic snapshot" section: AI-generated 2-3 sentence summary of the week's key competitive movements
- Generated daily, cached, shown as a static card on the dashboard

### Anti-Patterns

- Do not build a full graph database or graph visualization library in this phase
- Do not build autonomous agents that decide what to monitor based on signals
- Do not build AI-powered competitive strategy recommendations ("you should do X") — surface information, not decisions

---

## Phase 11 — Workflow Automation

**Status: Not started. Post-V1.**

### Goals

Intelligence triggers actions in connected systems. This phase connects the intelligence layer to the user's existing workflow.

### Subsystems (sequenced)

1. **Slack integration** — push alerts and weekly briefing to a Slack channel. Standard webhook integration. Most-requested integration.

2. **Outbound webhooks** — orgs can configure a webhook URL. When a high-signal event occurs, we POST a structured payload. Enables any custom integration.

3. **API access** — read-only API for enterprise customers to pull their intelligence data. Rate limited, API key managed in settings.

4. **Salesforce / HubSpot** — push competitive signals as CRM activities. Requires OAuth integration. High-value for GTM teams.

### Each Integration Is Vertical-Sliced

Build Slack completely before touching HubSpot. Each integration is self-contained: authentication, configuration UI, dispatch logic, error handling, retry logic.

---

## Phase 12 — Scaling Phase

**Status: Not started. Triggered by real scale problems, not anticipated ones.**

### When to Enter This Phase

Specific triggers that justify scaling infrastructure:
- Ingestion jobs queuing beyond 30 minutes (add Trigger.dev concurrency)
- Dashboard queries exceeding 2 seconds with real data (add indexes or read replica)
- Embedding generation backing up (add dedicated worker)
- Supabase Storage egress costs exceed $200/month (add CDN or optimize storage)

### What "Scaling" Means Here

This is a modular monolith on Vercel + Supabase. Scaling means:
- Adding Supabase read replica for analytics-heavy queries
- Moving embedding generation to a dedicated Trigger.dev queue
- Adding Upstash Redis for rate limiting and job backpressure
- Optimizing the most expensive database queries
- Adding database indexes for patterns that emerge from real usage

### What Scaling Does Not Mean

- Microservices
- Kubernetes
- A separate data warehouse
- A separate vector database
- Building a distributed ingestion system

These may eventually be necessary. They are not necessary until they are measured to be necessary.

---

## Cross-Phase Constraints
## Deferred Infrastructure Policy

The following systems are explicitly deferred until production bottlenecks justify them:

* microservices
* distributed queues
* Kafka/event buses
* Kubernetes
* multi-region infrastructure
* read replicas
* aggressive caching layers
* complex orchestration frameworks
* generalized agent systems
* autonomous multi-agent workflows
* advanced vector retrieval infrastructure
* large-scale embedding pipelines

Current infrastructure philosophy:

* correctness first
* operational simplicity
* architectural clarity
* minimal moving parts
* fast iteration cycles

Prefer:

* Vercel cron
* Supabase cron
* simple scheduled jobs
* direct database queries
* explicit orchestration
* deterministic pipelines

before introducing additional infrastructure complexity.

Infrastructure should emerge from real bottlenecks, not imagined scale.


These constraints apply across all phases and are never relaxed:

### Security Non-Negotiables

- Every new table has RLS before any code reads or writes it
- Every new API route validates org context before executing
- Every new Server Action calls `requireOrgContext()` as its first line
- The service role key is never used in any user-triggered code path

### Data Integrity Non-Negotiables

- Every `intelligence_event` has a valid `entity_id` — no orphaned events
- Every `ingestion_job` is linked to a rule (once Phase 6 is complete)
- Signal scores are always computed — never null — with a defined fallback value (50)
- Soft deletes only — no hard deletes of events, entities, or reports

### Code Quality Non-Negotiables

- No phase introduces a `'use client'` directive on a component that could be a Server Component
- No phase adds a new npm dependency without documented justification
- No phase adds direct Anthropic SDK imports outside `lib/ai/claude.ts`
- Every new AI pipeline has at least 5 test cases run manually before commit

---

## What We Deliberately Defer

These are capabilities that users may ask for, that seem reasonable, and that we are explicitly not building until specific phases:

| Capability | Deferred Until | Why |
|---|---|---|
| Mobile-first UX | Post-V1 | Desktop is the primary context; mobile is read-only initially |
| Bulk entity import (CSV) | Post-V1 | Manual import covers the seed-stage use case |
| White-labeling / custom domains | Post-V2 | VC platform use case, not core ICP |
| Multi-language support | Post-V2 | English is the operating language of the target market |
| Team collaboration features (comments, @mentions) | Phase 10+ | Intelligence is currently consumed individually |
| AI chatbot interface | Never in V1 | We are a structured intelligence platform, not a chatbot |
| Custom AI models / bring-your-own-key | Post-V2 | Adds operational complexity for low current demand |
| On-premise / self-hosted | Post-Series A | Infrastructure complexity requires dedicated engineering |
| Real-time collaborative editing | Never | Reports are generated artifacts, not collaborative documents |

Deferring these is not a failure to build them. It is the correct prioritization decision for a small team building a focused product. Every item on this list adds complexity, surface area for bugs, and cognitive load for the team. We build what delivers the most intelligence value per engineering hour.
