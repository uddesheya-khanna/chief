# Building a production-grade product architecture

_Created: 2026-05-13T23:21:32.338912Z_
_Updated: 2026-05-13T23:26:29.356656Z_

## Human

**Attachments:**
-  (5448 bytes)

---

## Assistant

```
This block is not supported on your current device yet.
```

This is a serious, comprehensive brief. I'll give you a thorough architectural document — practical, startup-aware, and production-grade. Let me build this out fully.

```
This block is not supported on your current device yet.
```

This is one of the most thorough product briefs I've seen. Let me deliver a complete, production-grade response across all 12 areas — then I'll build you a visual architecture overview.

---

# Founder Office Intelligence Platform — Complete Architecture & Product Blueprint

---

## 1. PRODUCT VISION

### Positioning

**Category name:** *Founder Office Intelligence* — not "AI research tool," not "competitive intelligence software." You're creating a new category.

**One-line positioning:** Continuous strategic intelligence infrastructure for modern founder offices.

**The framing that matters:** Most SaaS tools are reactive (you search, you get). You're building something proactive — a system that *watches the market on your behalf* and surfaces implications, not just data. The product is closer to a Bloomberg terminal crossed with a chief of staff than it is to a chatbot.

### ICP (Ideal Customer Profile)

**Primary:** Series A–C founders and their chiefs of staff at B2B SaaS, fintech, or deep tech companies. 50–500 employees. They have a defined market, named competitors, and live under pressure to be strategically ahead without the resources of a public company intelligence team.

**Secondary:** VC platform teams (typically 2–5 people serving a portfolio of 30–100 companies). They need the same intelligence across many companies at once.

**Tertiary:** GTM leaders (VP Sales, VP Marketing, CRO) at growth-stage companies who need competitive and market signals operationalized into pipeline motions.

### Wedge Strategy

Start narrow: **competitor intelligence for Series B SaaS founders.** This is the highest-pain, highest-willingness-to-pay use case with the clearest ROI story ("we knew their pricing changed before our reps did"). Win this wedge deeply — don't expand until it's undeniable.

Land via **founder communities** (On Deck, SaaStr, Lenny's, VC portfolio communities). The ICP trusts peer referrals over inbound ads.

### Market Differentiation

| Incumbent | Weakness | Your advantage |
|---|---|---|
| Crayon / Klue | Expensive, noisy, not AI-native, requires manual curation | Automated summarization + strategic implications |
| Perplexity / ChatGPT | No persistent monitoring, no structured entities, no alerts | Continuous monitoring, structured intelligence feeds |
| Notion + manual research | Labor-intensive, no proactive signals | Replaces the research associate, not the doc |
| Bombora / 6sense | Intent data only, no competitive layer | Unified competitive + market + investor signals |

Your core differentiator: **structured, contextualized intelligence that updates itself**, delivered in a premium UX that executives actually want to open.

---

## 2. CORE WORKFLOWS

**Competitor Intelligence:** Track N competitor entities. Monitor their website, blog, pricing page, LinkedIn, job postings, and press mentions. Detect changes. Classify them (pricing change, product launch, leadership change, expansion signal). Generate strategic implications in plain language. Alert the right people.

**GTM Signal Detection:** Monitor hiring signals (competitor hiring 10 AEs in a new market = expansion signal), pricing changes, product launches, and customer win/loss signals from G2/Capterra reviews. Surface them to sales and marketing teams with context.

**Investor Tracking:** Track specific VCs and their portfolio activity. Detect new investments (relevant to your space), partner moves, and thesis shifts. Build relationship intelligence over time.

**Partnership Opportunity Discovery:** Monitor companies at the intersection of your ICP and your tech stack. Detect integration announcements, partnership signals, and co-sell opportunities.

**Strategic Briefings:** Weekly AI-generated executive briefings. Synthesize the week's signals across all monitored entities into a structured document — top signals, strategic implications, recommended actions.

**Monitoring Dashboards:** Live feeds per entity type. Competitor feed, investor feed, market feed. Each with signal ranking, recency sorting, and tagging.

---

## 3. CORE ENTITIES & DATABASE DESIGN

Use Supabase (Postgres). Keep schemas tight and startup-friendly. No premature normalization.

```sql
-- Organizations (multi-tenant root)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'starter', -- starter | pro | enterprise
  settings jsonb default '{}',
  created_at timestamptz default now()
);

-- Users
create table users (
  id uuid primary key references auth.users,
  org_id uuid references organizations(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'member', -- owner | admin | member
  preferences jsonb default '{}',
  created_at timestamptz default now()
);

-- Tracked Entities (competitors, investors, partners, etc.)
create table tracked_entities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  type text not null, -- competitor | investor | partner | market | executive
  name text not null,
  domain text,
  description text,
  metadata jsonb default '{}', -- linkedin_url, crunchbase_url, ticker, etc.
  is_active boolean default true,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- Intelligence Events (the core unit of signal)
create table intelligence_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  entity_id uuid references tracked_entities(id) on delete cascade,
  source_url text,
  source_type text, -- website | linkedin | news | job_board | sec | twitter
  event_type text not null, -- pricing_change | product_launch | hiring_surge | funding | exec_move | partnership
  title text not null,
  summary text not null, -- AI-generated
  implication text, -- AI-generated strategic implication
  raw_content text,
  signal_score integer default 50, -- 0-100 relevance ranking
  metadata jsonb default '{}',
  detected_at timestamptz default now(),
  published_at timestamptz
);

-- Alerts
create table alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  event_id uuid references intelligence_events(id),
  user_id uuid references users(id),
  channel text not null, -- email | slack | in_app
  status text default 'pending', -- pending | sent | dismissed
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Monitoring Rules
create table monitoring_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  entity_id uuid references tracked_entities(id),
  rule_type text not null, -- website_change | keyword_alert | price_monitor | job_surge
  config jsonb not null, -- rule-specific config (URLs, keywords, thresholds)
  frequency text default 'daily', -- hourly | daily | weekly
  is_active boolean default true,
  last_run_at timestamptz,
  created_at timestamptz default now()
);

-- Reports (generated strategic briefings)
create table reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  title text not null,
  type text not null, -- weekly_briefing | competitor_snapshot | custom
  content jsonb not null, -- structured report content
  entity_ids uuid[] default '{}',
  event_ids uuid[] default '{}',
  generated_by text default 'system', -- system | user_id
  created_at timestamptz default now()
);

-- Saved Searches / Intelligence Feeds
create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references users(id),
  name text not null,
  query jsonb not null, -- filters: entity_ids, event_types, date_range, signal_score_min
  is_shared boolean default false,
  created_at timestamptz default now()
);

-- Relationship Graph (lightweight)
create table entity_relationships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  from_entity_id uuid references tracked_entities(id),
  to_entity_id uuid references tracked_entities(id),
  relationship_type text not null, -- competes_with | invested_in | partnered_with | acquired
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Ingestion Jobs (track pipeline runs)
create table ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id),
  entity_id uuid references tracked_entities(id),
  rule_id uuid references monitoring_rules(id),
  status text default 'queued', -- queued | running | completed | failed
  result_summary jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);
```

**Indexes to add from day one:**
```sql
create index on intelligence_events(org_id, detected_at desc);
create index on intelligence_events(entity_id, event_type);
create index on intelligence_events(signal_score desc);
create index on ingestion_jobs(org_id, status, created_at desc);
create index on tracked_entities(org_id, type, is_active);
```

Enable Row Level Security on every table. Policy: `org_id = auth.jwt() -> 'org_id'`.

---

## 4. SYSTEM ARCHITECTURE

**Philosophy:** Clean modular monolith. One Next.js app, one Supabase backend, background jobs via Trigger.dev (or pg_cron for simple cases). No microservices until you have >10k MAUs and a dedicated infra engineer.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App (Vercel)                      │
│                                                                   │
│  App Router Pages → Server Components → Server Actions           │
│  API Routes (/api/v1/*) → business logic handlers                │
│  Middleware → auth, org context, rate limiting                    │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
    ┌──────────▼──────────┐      ┌────────────▼────────────┐
    │   Supabase           │      │   Trigger.dev            │
    │   - Postgres DB      │      │   Background Jobs:       │
    │   - Auth             │      │   - Ingestion runs       │
    │   - Storage          │      │   - AI pipelines         │
    │   - Realtime         │      │   - Report generation    │
    │   - Edge Functions   │      │   - Alert dispatching    │
    └──────────┬──────────┘      └────────────┬────────────┘
               │                              │
    ┌──────────▼──────────────────────────────▼────────────┐
    │                   External Services                    │
    │   Anthropic API (Claude) │ OpenAI │ Firecrawl         │
    │   Resend (email)         │ Slack  │ Exa (AI search)   │
    │   Serper/Brave (news)    │ Hunter │ LinkedIn (scrape)  │
    └───────────────────────────────────────────────────────┘
```

### API Structure

Organize under `/app/api/v1/`:

```
/api/v1/
  entities/          CRUD for tracked entities
  events/            read, filter, dismiss intelligence events
  reports/           generate, fetch, list reports
  alerts/            manage alert preferences and history
  rules/             CRUD monitoring rules
  ingestion/         trigger manual ingestion runs
  search/            semantic search across events
  webhooks/          Slack, email inbound hooks
```

### Background Job Architecture (Trigger.dev)

```
Scheduled Jobs:
  - ingestion.runDue        every 15min  → picks up due monitoring rules
  - reports.generateWeekly  every Monday → weekly briefing per org
  - alerts.dispatch         every 5min   → sends pending alerts

Event-triggered Jobs:
  - ingestion.processResult  → after each crawl job completes
  - events.scoreAndImply     → after new event inserted
  - reports.onDemand         → user triggers manual report
```

---

## 5. INGESTION & INTELLIGENCE PIPELINES

### Ingestion Flow (per monitoring rule run)

```
1. FETCH
   - Website: Firecrawl → clean markdown of page content
   - News: Exa/Serper → recent articles by company name + keywords
   - Jobs: LinkedIn Jobs API or scrape → job listings delta
   - SEC/Crunchbase: direct API for funding events

2. DIFF & NORMALIZE
   - Compare fetched content against last snapshot (stored in Supabase Storage as .md)
   - Compute character-level diff for website changes
   - Deduplicate news articles by URL and title similarity (cosine similarity on embeddings)

3. CLASSIFY (LLM call #1 — fast, cheap)
   - Model: claude-haiku or gpt-4o-mini
   - Input: diff or article content + entity context
   - Output: { event_type, is_significant, confidence }
   - If not significant → skip, log, done

4. EXTRACT & SUMMARIZE (LLM call #2 — higher quality)
   - Model: claude-sonnet
   - Input: full content + event_type + entity profile
   - Structured output: { title, summary (2-3 sentences), key_facts[], implication }
   - Use Zod schema for output parsing — never trust raw JSON from LLM

5. SCORE
   - signal_score = weighted function of:
     - event_type weight (pricing_change=90, exec_move=80, product_launch=70, job_post=40)
     - entity importance rank (set by user)
     - recency
     - LLM confidence score

6. PERSIST
   - Insert intelligence_event row
   - Update entity last_seen_at
   - Trigger alert dispatch job if score > threshold
```

### Key Implementation Details

For **website monitoring**, store full page snapshots in Supabase Storage. On each run, fetch → normalize (strip nav/footer/dynamic elements via Firecrawl) → diff against stored snapshot → if diff > threshold, proceed.

For **pricing changes**, target `/pricing` pages explicitly. Store structured price tables as JSON snapshots. Diff price values numerically, not just textually — this avoids false positives from layout changes.

For **job signals**, track job count by category (engineering, sales, marketing) per entity over time. A hiring surge = >30% increase in open roles in a category over 30 days. This is a leading indicator of market moves.

For **funding events**, use Crunchbase API (or Harmonic) as ground truth. Don't try to scrape TechCrunch for this — the latency is too high and the structured APIs are good.

---

## 6. AI LAYER

### Design Principles

Never build autonomous agents. Build **pipelines with human checkpoints**. Every AI output should be inspectable, attributable to a source, and dismissable by the user.

### Structured Output Convention

Always use Zod schemas parsed from LLM responses. Never use raw JSON.parse on LLM output. Example:

```typescript
const EventSchema = z.object({
  title: z.string().max(120),
  summary: z.string().max(400),
  event_type: z.enum(['pricing_change','product_launch','hiring_surge','funding','exec_move','partnership','other']),
  key_facts: z.array(z.string()).max(5),
  implication: z.string().max(300),
  confidence: z.number().min(0).max(1),
  is_significant: z.boolean()
});
```

### Pipeline Architecture

**Summarization Pipeline:**
```
Input: raw content + entity context + event_type hint
System prompt: You are a strategic intelligence analyst for a [entity_type] company. 
               Extract signal from noise. Be specific, not generic.
               Never say "the company announced" — say what specifically they announced.
Output: EventSchema (structured)
```

**Strategic Implication Generation:**
```
Input: summarized event + org context (their product, market, stage)
System prompt: You are a chief of staff. Given this event about [competitor], 
               what is the single most important implication for [our_company]?
               Be direct. No hedging. One sentence.
Output: implication string (50-150 words)
```

**Weekly Briefing Generation:**
```
Input: top N events from past 7 days (ranked by signal_score)
       + org context + previous briefing (for continuity)
System prompt: Generate a concise executive intelligence briefing.
               Structure: Top Signal, Competitive Landscape, GTM Implications, Recommended Actions
Output: structured JSON with sections
Render: as formatted report page in app
```

**Retrieval Architecture:**
- Embed all intelligence_events using text-embedding-3-small (1536 dims) on insert
- Store embeddings in pgvector (Supabase supports this natively)
- On search: embed query → cosine similarity search → rerank by recency × score
- Use this for the search UX and for "related signals" on entity pages

```sql
-- Add to intelligence_events
alter table intelligence_events add column embedding vector(1536);
create index on intelligence_events using ivfflat (embedding vector_cosine_ops);
```

---

## 7. FRONTEND STRUCTURE

### App Routes

```
/                         → marketing site (or redirect to /dashboard)
/auth/login               → login
/auth/signup              → onboarding flow

/dashboard                → home feed (recent signals, org summary)
/feed                     → full intelligence feed (filterable)
/entities                 → all tracked entities grid
/entities/[id]            → entity detail page (timeline + signals + report)
/entities/new             → add entity wizard

/competitors              → competitor-specific view
/investors                → investor tracking view
/market                   → market signals view

/reports                  → all reports list
/reports/[id]             → report reader
/reports/new              → custom report builder

/alerts                   → alert history + preferences
/search                   → semantic search UI

/settings                 → org settings
/settings/team            → members
/settings/integrations    → Slack, email, webhooks
/settings/billing         → plan management
/onboarding               → multi-step setup wizard
```

### Sidebar Structure

```
[Logo + org switcher]

INTELLIGENCE
  Dashboard
  Feed
  Search

ENTITIES
  Competitors
  Investors
  Partners
  Market

REPORTS
  Briefings
  Snapshots
  Custom

SYSTEM
  Alerts
  Settings
```

### Dashboard Layout

Top row: 4 metric cards (signals this week, entities tracked, alerts sent, top event score)
Main area: split — left 65% = intelligence feed (filterable, paginated), right 35% = entity list with last signal per entity
Bottom: upcoming scheduled reports, alert queue

### Entity Detail Page

Header: entity name, type badge, domain, last crawled
Tabs: Timeline | Signals | Reports | Settings
Timeline: chronological feed of all intelligence_events for this entity
Signals: filterable table of events with type, date, score, implication preview
Reports: all reports that include this entity

---

## 8. UI/UX SYSTEM

### Design Philosophy

**Information density with breathing room.** Never empty-state aesthetics, never cluttered dashboards. Every pixel should earn its place. Executives scan — optimize for scannability over discovery.

**Typography:** Use Geist (Vercel's font — free, sharp, premium, ideal for data UIs) or DM Sans. Display headings in a heavier weight. Monospaced elements (scores, timestamps) in Geist Mono.

### Spacing System (8px base)

```
4px  — internal component micro-gaps (badge padding, icon margin)
8px  — tight component spacing (input icon gap, list item padding-y)
12px — standard component gap
16px — card padding, section gap
24px — section separator
32px — page section margin
48px — major section break
64px — page-level top padding
```

### Color System

```css
/* Foundation */
--bg-base: #F8F7F4;          /* warm off-white page bg */
--bg-surface: #FFFFFF;       /* cards, panels */
--bg-elevated: #F2F1EE;      /* hover states, secondary panels */

/* Text */
--text-primary: #1A1A18;     /* near-black */
--text-secondary: #5C5B57;   /* muted body */
--text-tertiary: #9C9A94;    /* timestamps, captions */

/* Accents */
--accent-emerald: #1A7A4A;   /* primary actions, active states */
--accent-emerald-soft: #E8F5EE;  /* badges, backgrounds */
--accent-indigo: #3D52CC;    /* links, secondary accent */
--accent-amber: #B45309;     /* warnings, high-signal indicators */

/* Borders */
--border-subtle: rgba(0,0,0,0.06);
--border-default: rgba(0,0,0,0.10);
--border-strong: rgba(0,0,0,0.18);

/* Signal scoring colors */
--signal-high: #1A7A4A;      /* score 80-100 */
--signal-med: #B45309;       /* score 50-79 */
--signal-low: #9C9A94;       /* score 0-49 */
```

### Component Hierarchy

**Signal Card** (core atomic unit of the product):
- Left border color-coded by signal score
- Entity name (small, muted) + event type badge
- Event title (medium weight, primary text)
- AI-generated implication (italic, muted)
- Source URL + timestamp (tertiary, right-aligned)
- Hover: slight elevation, dismiss/save actions appear

**Entity Card:**
- Logo/favicon + name + type badge
- Last signal preview (truncated)
- Signal count badge + last active timestamp
- Status indicator (active/paused)

**Report Card:**
- Report type badge + title
- Generated date + entity count
- Preview of top signal
- Open button (right-aligned)

### Table Design

Use shadcn/ui Table as base. Customize:
- Row height: 52px (comfortable scanning density)
- Column headers: uppercase, 11px, letter-spacing 0.08em, muted color
- Cell text: 13-14px
- Row hover: `--bg-elevated` background
- No vertical gridlines — only subtle horizontal separators
- Sticky header on scroll
- Inline actions appear on row hover (dismiss, open, share)

### Motion Philosophy

Minimal, purposeful, fast. Nothing that delays information:
- Page transitions: 150ms fade (opacity only)
- Feed item enter: 200ms slide-in from bottom + fade (staggered, max 5 items)
- Alert badge pulse: slow 2s ease infinite, low opacity change only
- Skeleton loaders for all async content — no spinners
- Zero animation on data tables — they must feel instant

---

## 9. FOLDER STRUCTURE

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              ← sidebar + top nav shell
│   │   ├── dashboard/page.tsx
│   │   ├── feed/page.tsx
│   │   ├── entities/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── competitors/page.tsx
│   │   ├── investors/page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── alerts/page.tsx
│   │   ├── search/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── team/page.tsx
│   │       └── integrations/page.tsx
│   ├── api/
│   │   └── v1/
│   │       ├── entities/route.ts
│   │       ├── events/route.ts
│   │       ├── reports/route.ts
│   │       ├── alerts/route.ts
│   │       ├── search/route.ts
│   │       └── webhooks/
│   │           ├── slack/route.ts
│   │           └── ingestion/route.ts
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                         ← shadcn/ui primitives (auto-generated)
│   ├── app/
│   │   ├── sidebar.tsx
│   │   ├── top-nav.tsx
│   │   └── org-switcher.tsx
│   ├── feed/
│   │   ├── signal-card.tsx
│   │   ├── signal-feed.tsx
│   │   ├── feed-filters.tsx
│   │   └── feed-skeleton.tsx
│   ├── entities/
│   │   ├── entity-card.tsx
│   │   ├── entity-detail.tsx
│   │   ├── entity-timeline.tsx
│   │   └── add-entity-wizard.tsx
│   ├── reports/
│   │   ├── report-card.tsx
│   │   └── report-reader.tsx
│   └── shared/
│       ├── signal-score-badge.tsx
│       ├── event-type-badge.tsx
│       ├── entity-avatar.tsx
│       └── empty-state.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ← browser client
│   │   ├── server.ts               ← server component client
│   │   └── middleware.ts
│   ├── ai/
│   │   ├── claude.ts               ← Anthropic client + wrapper
│   │   ├── pipelines/
│   │   │   ├── classify-event.ts
│   │   │   ├── summarize-event.ts
│   │   │   ├── generate-implication.ts
│   │   │   └── generate-briefing.ts
│   │   ├── prompts/
│   │   │   ├── classify.ts
│   │   │   ├── summarize.ts
│   │   │   └── briefing.ts
│   │   └── schemas/
│   │       ├── event.schema.ts
│   │       └── report.schema.ts
│   ├── ingestion/
│   │   ├── crawl.ts                ← Firecrawl wrapper
│   │   ├── search.ts               ← Exa/Serper wrapper
│   │   ├── diff.ts                 ← content diffing
│   │   ├── jobs.ts                 ← job board scraping
│   │   └── normalize.ts
│   ├── alerts/
│   │   ├── email.ts                ← Resend
│   │   └── slack.ts
│   ├── embeddings/
│   │   └── index.ts                ← embed + search functions
│   └── utils/
│       ├── signal-score.ts
│       └── format.ts
│
├── actions/                        ← Next.js Server Actions
│   ├── entities.ts
│   ├── reports.ts
│   ├── alerts.ts
│   └── rules.ts
│
├── types/
│   ├── database.ts                 ← Supabase generated types
│   └── app.ts                      ← app-level type aliases
│
├── jobs/                           ← Trigger.dev job definitions
│   ├── ingestion.ts
│   ├── reports.ts
│   └── alerts.ts
│
└── middleware.ts
```

---

## 10. BUILD ROADMAP

### Phase 1 — Foundation (Weeks 1–4)

Build the skeleton that proves the core value proposition.

- Auth + org creation (Supabase Auth, org table, RLS)
- Add tracked entity flow (competitor, manual URL input)
- First ingestion pipeline: Firecrawl → Claude summarize → store event
- Signal card UI + basic feed
- Email alert (Resend) when new event > threshold
- Vercel deployment + staging environment

**Exit criteria:** A founder can add 3 competitors, get a daily email with AI-summarized changes, and see them in a feed. Nothing else matters yet.

### Phase 2 — Intelligence Layer (Weeks 5–8)

- Full event classification pipeline (all 6 event types)
- Strategic implication generation per event
- Signal scoring system
- Entity detail page with timeline
- News/press monitoring (Exa API)
- Job posting monitoring (basic)
- Weekly briefing generation (manual trigger first, then scheduled)
- Slack integration (basic webhook)

### Phase 3 — Product Polish (Weeks 9–12)

- Semantic search (pgvector + embeddings)
- Saved searches / intelligence feeds
- Monitoring rules UI (user-configurable)
- Report builder (custom reports)
- Onboarding wizard
- Alert preferences (per-user, per-entity thresholds)
- Relationship graph (lightweight, manual)
- Investor tracking entity type

### V1 Launch (Month 4)

- All core entity types fully supported
- Mobile-responsive (read-only on mobile is fine)
- Team roles (owner/admin/member)
- Billing integration (Stripe)
- Usage limits by plan
- Public changelog / roadmap

### V2 (Months 5–8)

- API access for enterprise customers
- Custom monitoring rules (advanced)
- Webhooks outbound (push intelligence to their stack)
- VC platform multi-org dashboard
- Executive briefing PDF export
- Salesforce/HubSpot integration (push competitive signals to CRM)

### Scaling Considerations

- Move background jobs to dedicated Trigger.dev workers before Vercel function timeouts become an issue (>1000 monthly ingestion runs)
- Add read replica for analytics queries when dashboard queries get slow
- Introduce a queue (Redis/Upstash) for ingestion job backpressure before you hit Trigger.dev concurrency limits
- Split AI pipeline from ingestion pipeline at ~10k events/day to separate concerns

---

## 11. WHAT TO AVOID

### Architectural Traps

**Don't build a "platform" on day one.** The temptation is to build a perfectly extensible plugin architecture before you've validated a single workflow. Start with hardcoded pipelines for 3 event types. Generalize after you've seen 20 real customer workflows.

**Don't over-abstract the AI layer.** Avoid building a "universal prompt manager" or "AI workflow engine" before you have 5 working pipelines. Premature abstraction here costs weeks and produces brittle code.

**Don't use streaming AI responses in background jobs.** Streaming is for user-facing chat UX. Your ingestion pipelines need reliable, complete responses. Always use non-streaming completion calls with structured outputs.

### AI Anti-Patterns

**Don't trust raw LLM JSON.** Always validate with Zod. LLMs hallucinate field names, add extra fields, return markdown-wrapped JSON. Build a robust parse → validate → fallback chain.

**Don't run classification and summarization in a single prompt.** Separate them. Classification (is this significant? what type?) needs a different, faster model than summarization (what exactly happened, and what does it mean?). Two cheap fast calls beat one expensive slow call.

**Don't generate "strategic implications" without org context.** An implication about a competitor pricing change means something completely different for a bootstrapped startup vs a Series C company. Always inject org context into implication prompts.

**Don't embed everything.** Only embed content you'll actually search. Embeddings for monitoring_rules or users are waste. Embed intelligence_events — that's it.

### Common RAG Mistakes

- Embedding chunked raw HTML instead of normalized, cleaned content
- Not deduplicating near-identical articles before embedding
- Using cosine similarity alone without recency reranking (old signals pollute results)
- Building a chatbot UI around RAG instead of a structured search UI — your users aren't asking open-ended questions, they're filtering and scanning

### Common Ingestion Mistakes

- Crawling full sites instead of targeting specific pages (pricing, blog, jobs, about)
- Not storing raw snapshots — you'll need them for debugging LLM extraction errors
- No deduplication layer — the same funding announcement will appear in 15 news sources
- Ignoring rate limits on job board scraping (LinkedIn is aggressive; use their official APIs or Coresignal)

### Premature Infra Complexity

Don't introduce: message queues (use Trigger.dev), separate vector databases (use pgvector), Redis caching (use ISR and SWR), Kubernetes (use Vercel), separate data warehouse (use Postgres with good indexes until 10M+ rows).

---

## 12. RECOMMENDED DEVELOPMENT WORKFLOW

### Cursor

Set up a `.cursorrules` file at project root:
```
This is a Next.js 14 App Router TypeScript project.
Always use server components by default. Only use 'use client' when strictly necessary.
Always use Zod for validation. Never use raw JSON.parse on external data.
Database access goes through /lib/supabase/server.ts in server components.
Client-side data fetching uses SWR with /lib/supabase/client.ts.
AI calls go through /lib/ai/claude.ts — never import Anthropic SDK directly.
shadcn/ui components live in /components/ui — never modify them directly.
```

Use Cursor's Composer for: building new pages from scratch, refactoring entire modules, writing Trigger.dev job files. Use inline suggestions for: adding TypeScript types, writing Zod schemas, adding Supabase RLS policies.

### Claude (meta-usage)

Use Claude for: writing system prompts for your AI pipelines (iterate with examples), designing Zod schemas from your data model, writing Supabase RLS policies, reviewing your ingestion pipeline for edge cases, drafting onboarding copy. Keep a `prompts/` folder and version your system prompts like code.

### shadcn/ui

Run `npx shadcn@latest add [component]` for every new component before building custom. Use Table, Card, Badge, Command, Sheet, Dialog, and Tabs heavily. Extend rather than rebuild — override via className, not by modifying the component file. Build your own compound components (SignalCard, EntityCard) on top of shadcn primitives.

### 21st.dev

Use for finding polished component recipes for complex UI patterns: data tables with filters, command palettes, multi-step wizards. Treat it as a premium reference library — copy patterns, adapt to your design system, don't use code verbatim.

### Supabase

Use the Supabase CLI from day one (`supabase init`, `supabase db diff`). Never make schema changes in the dashboard — always through migrations. Use `supabase gen types typescript` in CI to keep your types in sync. Enable RLS on every table immediately — don't leave it for "later." Use Edge Functions only for webhook receivers where latency matters; everything else goes in Next.js API routes.

### Vercel

One staging environment (preview deploys from `staging` branch), one production (from `main`). Set all secrets in Vercel environment variables — never in `.env.local` for production values. Use Vercel's cron jobs (via `vercel.json`) only for lightweight scheduled triggers; heavy jobs go to Trigger.dev. Monitor function duration — if an API route consistently exceeds 10s, move the logic to a background job.

---

Now let me build you the system architecture diagram:

```
This block is not supported on your current device yet.
```

And the core ingestion pipeline flow:

```
This block is not supported on your current device yet.
```

---

That's the complete blueprint. A few closing observations on what will make or break this:

**The one thing that determines success faster than anything else:** how good your AI-generated "implication" is. If it's generic ("this may impact your competitive position"), founders will ignore it immediately. If it's specific and actionable ("Acme is now cheaper than you for SMB accounts — expect this to come up in Q4 deal reviews"), they'll pay for it and tell others. Invest disproportionate time in the implication prompt, with real org context injection. That's your moat.

**The second:** the signal-to-noise ratio of your feed. Most competitive intel tools fail because they drown users in noise and train them to stop opening the product. Your signal_score system needs to be ruthlessly tuned. Start with a very high threshold — better to miss a signal than to cry wolf. Users who get 2 high-quality signals a week will pay; users who get 30 mediocre ones will churn.

**Build order if you're a solo founder or 2-person team:** DB schema → Supabase setup → add entity UI → one working ingestion job (Firecrawl + Claude) → signal card UI → email alert. That's your V0. Everything else is iteration.

---
