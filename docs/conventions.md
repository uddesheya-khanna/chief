# Engineering Conventions

> This document is the authoritative source of truth for how we write, structure, and maintain this codebase. It is not aspirational. It describes how we actually work. Every engineer, AI assistant, and future contributor is expected to follow these conventions without exception.
>
> Last principle: when in doubt, do less. A system that does three things correctly is worth more than one that does ten things approximately.

---

## Table of Contents

1. [Architectural Philosophy](#1-architectural-philosophy)
2. [Repository Structure](#2-repository-structure)
3. [Modular Monolith Rules](#3-modular-monolith-rules)
4. [Server Components Philosophy](#4-server-components-philosophy)
5. [Client Component Restrictions](#5-client-component-restrictions)
6. [Supabase Usage Rules](#6-supabase-usage-rules)
7. [Row-Level Security Expectations](#7-row-level-security-expectations)
8. [Zod Validation Rules](#8-zod-validation-rules)
9. [API Route Conventions](#9-api-route-conventions)
10. [Server Actions Conventions](#10-server-actions-conventions)
11. [Naming Conventions](#11-naming-conventions)
12. [State Management Philosophy](#12-state-management-philosophy)
13. [Data Loading Philosophy](#13-data-loading-philosophy)
14. [Async / Loading / Error State Standards](#14-async--loading--error-state-standards)
15. [Form Handling Standards](#15-form-handling-standards)
16. [AI Pipeline Standards](#16-ai-pipeline-standards)
17. [Ingestion Architecture Standards](#17-ingestion-architecture-standards)
18. [Schema Evolution Philosophy](#18-schema-evolution-philosophy)
19. [Environment Variable Conventions](#19-environment-variable-conventions)
20. [Logging Philosophy](#20-logging-philosophy)
21. [Abstraction Philosophy](#21-abstraction-philosophy)
22. [Anti-Patterns](#22-anti-patterns)
23. [Code Review Standards](#23-code-review-standards)
24. [AI-Assisted Coding Workflow](#24-ai-assisted-coding-workflow)

---

## 1. Architectural Philosophy

This is a **modular monolith**. One Next.js application, one Supabase project, one deployment target. This is not a microservices architecture and will not become one until there is a clear, quantified reason — which means active bottlenecks measured in production, not anticipated ones in planning meetings.

### Core Principles

**Simplicity is a feature.** Every abstraction layer, every service boundary, every infrastructure component carries operational and cognitive cost. That cost must be justified by a concrete, present problem — not a future one we imagine.

**Data locality.** Business logic lives close to data. We do not build service layers that shuttle data between identical representations. A server component that fetches and renders is better than a component that fetches, transforms, passes through a hook, passes through a context, and then renders.

**Correctness before completeness.** A feature that works correctly for 100% of its defined scope is worth more than a feature that works approximately for 150% of it. Scope creep during implementation is an anti-pattern.

**The filesystem is the architecture.** The folder structure is not organizational aesthetics — it is a constraint system that enforces separation of concerns. Putting something in the wrong place is an architectural violation, not a style preference.

**AI assistance is not a license to generate complexity.** AI-generated code has a strong bias toward verbosity, abstraction, and over-engineering. When using AI tools, the human is responsible for ruthlessly reducing the output to its minimum viable form.

---

## 2. Repository Structure

```
/
├── app/
│   ├── (auth)/                    # Auth routes — no layout shell
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/                     # Authenticated app routes
│   │   ├── layout.tsx             # Shell: sidebar + topnav
│   │   ├── dashboard/
│   │   ├── feed/
│   │   ├── entities/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── competitors/
│   │   ├── investors/
│   │   ├── reports/
│   │   ├── alerts/
│   │   ├── search/
│   │   └── settings/
│   ├── api/
│   │   └── v1/
│   │       ├── entities/
│   │       ├── events/
│   │       ├── reports/
│   │       ├── alerts/
│   │       ├── search/
│   │       └── webhooks/
│   ├── layout.tsx                 # Root layout — fonts, providers
│   └── globals.css
│
├── components/
│   ├── ui/                        # shadcn/ui primitives — never modified directly
│   ├── app/                       # App shell: sidebar, topnav, org-switcher
│   ├── feed/                      # Signal card, feed, filters, skeleton
│   ├── entities/                  # Entity card, detail, timeline, wizard
│   ├── reports/                   # Report card, report reader
│   └── shared/                    # Cross-domain: badges, avatars, empty states
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client (singleton)
│   │   ├── server.ts              # Server component client
│   │   └── middleware.ts          # Auth + org context injection
│   ├── ai/
│   │   ├── claude.ts              # Anthropic SDK wrapper — the only import point
│   │   ├── pipelines/             # Discrete, testable pipeline functions
│   │   ├── prompts/               # Versioned prompt strings (not inline)
│   │   └── schemas/               # Zod schemas for all AI outputs
│   ├── ingestion/
│   │   ├── crawl.ts               # Firecrawl wrapper
│   │   ├── search.ts              # Exa / Serper wrapper
│   │   ├── diff.ts                # Content diffing
│   │   └── normalize.ts           # Content normalization
│   ├── alerts/
│   │   ├── email.ts               # Resend wrapper
│   │   └── slack.ts               # Slack webhook wrapper
│   ├── embeddings/
│   │   └── index.ts               # Embed + vector search functions
│   └── utils/
│       ├── signal-score.ts
│       └── format.ts
│
├── actions/                       # Next.js Server Actions — one file per domain
│   ├── entities.ts
│   ├── events.ts
│   ├── reports.ts
│   ├── alerts.ts
│   └── rules.ts
│
├── jobs/                          # Trigger.dev job definitions
│   ├── ingestion.ts
│   ├── reports.ts
│   └── alerts.ts
│
├── types/
│   ├── database.ts                # Auto-generated from Supabase CLI — never hand-edited
│   └── app.ts                     # App-level type aliases and domain types
│
├── supabase/
│   ├── migrations/                # All schema changes — never edited after commit
│   └── seed.sql
│
└── docs/
    ├── architecture.md
    ├── conventions.md             # This document
    ├── design-principles.md
    └── implementation-roadmap.md
```

### Rules

- Every directory must have a single clear responsibility. If you cannot name it in five words, split it.
- `lib/` contains pure logic. No React. No JSX. No UI concerns.
- `components/` contains UI. No direct database calls. Data comes in as props or from server components above.
- `actions/` contains all data mutations. No mutations happen outside of Server Actions or API routes.
- `jobs/` contains all background processing definitions. Business logic shared with jobs lives in `lib/`.
- Do not create new top-level directories without explicit team discussion.

---

## 3. Modular Monolith Rules

We organize code by **domain**, not by technical layer. The domain boundaries are:

| Domain | Owns |
|---|---|
| `entities` | Tracked entity CRUD, metadata, relationships |
| `events` | Intelligence event ingestion, storage, retrieval |
| `reports` | Report generation, storage, rendering |
| `alerts` | Alert rules, dispatch, delivery |
| `ingestion` | Crawling, diffing, normalization |
| `ai` | All LLM calls, prompt management, output parsing |
| `embeddings` | Vector generation, semantic search |
| `organizations` | Multi-tenancy, billing, settings |
| `users` | Auth, profiles, preferences |

### Boundary Rules

- A domain module in `lib/` may import from `lib/utils/` and `types/`.
- A domain module may **not** import from another domain module directly. Cross-domain orchestration happens in Server Actions, API routes, or background jobs — never by coupling two lib modules.
- If you find yourself importing `lib/entities/` from `lib/ingestion/`, you are coupling domains. Extract the shared concept to `types/` or create a deliberate orchestration point.
- `components/` subdirectories mirror domain boundaries. `components/feed/` imports from `types/` and receives data as props. It does not import from `lib/`.

### When to Add a New Module

Only when you have three or more cohesive functions that share internal state or configuration and that no existing module owns. Do not create a module for a single function.

---

## 4. Server Components Philosophy

**Server Components are the default.** Every component is a Server Component unless it explicitly requires client-side behavior. The decision to add `'use client'` must be justified at code review.

### Server Component Benefits We Actively Exploit

- Direct database access without a fetch round-trip
- No client bundle contribution
- Async/await with no useEffect required
- Data fetching co-located with rendering

### Server Component Patterns

```typescript
// Correct: fetch in the component, render directly
// app/(app)/entities/[id]/page.tsx
export default async function EntityPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: entity } = await supabase
    .from('tracked_entities')
    .select('*, intelligence_events(*)')
    .eq('id', params.id)
    .single()

  if (!entity) notFound()

  return <EntityDetail entity={entity} />
}
```

```typescript
// Correct: pass data down as props to a client component that needs interactivity
// components/entities/entity-detail.tsx
'use client'
export function EntityDetail({ entity }: { entity: EntityWithEvents }) {
  const [activeTab, setActiveTab] = useState('timeline')
  // ...
}
```

### What Belongs in Server Components

- All data fetching (Supabase queries)
- All initial page rendering
- All static or server-generated content
- Layouts, shells, and navigation structures
- Heavy data transformations that don't need reactivity

### What Does Not Belong in Server Components

- useState, useEffect, useRef, useContext
- Browser APIs (window, document, localStorage)
- Event handlers that respond to user interaction
- Third-party client-side libraries (charts, rich text editors)

---

## 5. Client Component Restrictions

`'use client'` is a boundary declaration, not a default. It should appear as close to the leaf of the component tree as possible.

### Approved Reasons for `'use client'`

1. The component uses `useState` or `useReducer` for local interactive state
2. The component uses `useEffect` for browser-side effects (resize observers, focus management, etc.)
3. The component handles user events (clicks, form inputs, drag interactions)
4. The component uses a third-party library that requires browser context
5. The component uses `useRouter`, `usePathname`, or `useSearchParams`

### Not Approved Reasons

- "It was easier" — this is a red flag
- The component uses SWR or React Query — reconsider whether you need client-side fetching at all
- The component needs data that "changes" — if it changes on user action, a Server Action + `revalidatePath` is usually cleaner

### The Leaf Rule

If a page has 10 components and only the dropdown menu needs `useState`, only the dropdown gets `'use client'`. The page, the layout, the section containers, the data tables — all remain server components.

```typescript
// Wrong: marking a large component client just for a small interactive element
'use client'
export function EntityDetailSection({ entity }) {
  const [open, setOpen] = useState(false) // only this needs client
  return (
    <div>
      <EntityHeader entity={entity} />  {/* doesn't need client */}
      <EntityTimeline events={entity.events} />  {/* doesn't need client */}
      <DropdownMenu open={open} onOpenChange={setOpen} />  {/* needs client */}
    </div>
  )
}

// Correct: extract the interactive element
// entity-detail-section.tsx (server)
export function EntityDetailSection({ entity }) {
  return (
    <div>
      <EntityHeader entity={entity} />
      <EntityTimeline events={entity.events} />
      <EntityActions entityId={entity.id} />  {/* client component, isolated */}
    </div>
  )
}
```

---

## 6. Supabase Usage Rules

### Client Instantiation

There are exactly two Supabase client creation patterns. Use no others.

**Server components, Server Actions, API routes:**
```typescript
import { createServerClient } from '@/lib/supabase/server'
const supabase = createServerClient()
```

**Client components (when unavoidable):**
```typescript
import { createBrowserClient } from '@/lib/supabase/client'
const supabase = createBrowserClient()
```

Never instantiate `createClient` from `@supabase/supabase-js` directly anywhere outside of `lib/supabase/`. Those two files are the only place the Supabase SDK is directly imported.

### Query Rules

**Always select specific columns.** Never use `select('*')` in production code outside of seed scripts or one-off debugging.

```typescript
// Wrong
const { data } = await supabase.from('tracked_entities').select('*')

// Correct
const { data } = await supabase
  .from('tracked_entities')
  .select('id, name, type, domain, is_active, created_at')
```

**Always handle errors.** The `{ data, error }` pattern means errors are ignored by default. Always check.

```typescript
// Wrong
const { data } = await supabase.from('intelligence_events').select('...')

// Correct
const { data, error } = await supabase.from('intelligence_events').select('...')
if (error) {
  console.error('[events:fetch]', error.message)
  throw new Error('Failed to fetch intelligence events')
}
```

**Always scope by org_id.** Every query against a multi-tenant table must filter by `org_id`. RLS is a safety net, not a substitute for correct query construction.

```typescript
const { data } = await supabase
  .from('intelligence_events')
  .select('id, title, summary, signal_score')
  .eq('org_id', orgId)  // always explicit
  .order('detected_at', { ascending: false })
  .limit(50)
```

**Use `.single()` only when you expect exactly one row.** If there's any chance of zero rows, use `.maybeSingle()` and handle the null case explicitly.

### Mutations

All database mutations happen through **Server Actions** or **API routes**. No client component writes directly to Supabase.

```typescript
// Wrong: client component writing to Supabase
const supabase = createBrowserClient()
await supabase.from('tracked_entities').insert({ name, type, org_id })

// Correct: client calls a Server Action
await createEntityAction({ name, type }) // org_id injected server-side
```

### Realtime

Use Supabase Realtime sparingly. It is appropriate for:
- In-app notification badge updates
- Feed updates when a new intelligence event arrives (optional)

It is not appropriate for replacing polling-based data loading on pages where `revalidatePath` or SWR with a reasonable interval is sufficient.

---

## 7. Row-Level Security Expectations

RLS is **mandatory** on every table that contains tenant data. This is a non-negotiable security requirement, not a feature.

### Policy Structure

Every multi-tenant table must have these four policies at minimum:

```sql
-- SELECT
create policy "Users can read own org data"
  on table_name for select
  using (org_id = (auth.jwt() -> 'org_id')::uuid);

-- INSERT
create policy "Users can insert into own org"
  on table_name for insert
  with check (org_id = (auth.jwt() -> 'org_id')::uuid);

-- UPDATE
create policy "Users can update own org data"
  on table_name for update
  using (org_id = (auth.jwt() -> 'org_id')::uuid);

-- DELETE
create policy "Users can delete own org data"
  on table_name for delete
  using (org_id = (auth.jwt() -> 'org_id')::uuid);
```

### Service Role Usage

The service role key bypasses RLS. It is used only in:
- Background jobs (Trigger.dev) that run outside user context
- Ingestion pipelines that write events on behalf of a monitored rule
- Internal admin operations (never exposed through any user-facing API route)

The service role key is never used in any code path that a user can trigger directly through the UI.

### JWT Claims

The `org_id` claim is injected into the JWT by a Supabase Auth hook on login. Middleware validates this claim on every request. The claim is trusted for RLS but the explicit `org_id` filter in queries remains — defense in depth.

---

## 8. Zod Validation Rules

All external data is validated with Zod before use. "External data" means:

- API route request bodies
- Server Action form data
- LLM API responses
- Third-party webhook payloads
- Crawled/scraped content before processing
- Any environment variable used at runtime

### Schema Location

Zod schemas live in `lib/ai/schemas/` for AI output schemas and in the relevant action or route file for request validation. Do not inline complex schemas in business logic.

### Validation Pattern

```typescript
// lib/ai/schemas/event.schema.ts
import { z } from 'zod'

export const ClassifiedEventSchema = z.object({
  event_type: z.enum([
    'pricing_change',
    'product_launch',
    'hiring_surge',
    'funding',
    'exec_move',
    'partnership',
    'other'
  ]),
  is_significant: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(200)
})

export type ClassifiedEvent = z.infer<typeof ClassifiedEventSchema>
```

```typescript
// Usage in pipeline
const raw = await callClaude(prompt)
const parsed = ClassifiedEventSchema.safeParse(JSON.parse(raw))

if (!parsed.success) {
  console.error('[classify] Schema validation failed:', parsed.error.issues)
  return { event_type: 'other', is_significant: false, confidence: 0, reasoning: 'parse_failed' }
}

return parsed.data
```

### Rules

- Always use `safeParse` for LLM outputs — never `parse`. LLMs produce malformed output; crashing a background job is worse than logging a parse failure.
- Always use `parse` for request bodies in API routes and Server Actions — throw on invalid input rather than continuing with bad data.
- Schema types are derived with `z.infer<typeof Schema>`. Do not write duplicate TypeScript interfaces for validated schemas.
- Schemas are versioned via the file — if a schema changes incompatibly, create a new version file, not a modified old one.

---

## 9. API Route Conventions

API routes live under `app/api/v1/`. The `v1` prefix is mandatory — it is our public API contract even if we are the only consumer today.

### Route File Structure

```typescript
// app/api/v1/entities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/lib/supabase/middleware'
import { z } from 'zod'

const CreateEntitySchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['competitor', 'investor', 'partner', 'market', 'executive']),
  domain: z.string().url().optional(),
  description: z.string().max(1000).optional()
})

export async function GET(req: NextRequest) {
  const { org, error } = await getOrgContext(req)
  if (error) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data, error: dbError } = await supabase
    .from('tracked_entities')
    .select('id, name, type, domain, is_active, created_at')
    .eq('org_id', org.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { org, user, error } = await getOrgContext(req)
  if (error) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateEntitySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error: dbError } = await supabase
    .from('tracked_entities')
    .insert({ ...parsed.data, org_id: org.id, created_by: user.id })
    .select('id, name, type')
    .single()

  if (dbError) return NextResponse.json({ error: 'Failed to create entity' }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
```

### API Route Rules

- Every route validates the org context before doing anything else.
- Every route validates input with Zod before touching the database.
- Error responses always include a human-readable `error` string.
- Success responses always wrap data in `{ data: ... }`.
- HTTP status codes are used correctly: 200 GET, 201 POST, 400 bad input, 401 unauth, 403 forbidden, 404 not found, 500 server error.
- No business logic in route files. Complex operations are extracted to `lib/` or `actions/`.
- Route files are thin orchestrators: validate → call lib → respond.

---

## 10. Server Actions Conventions

Server Actions are the preferred mutation path for UI-triggered writes. They are faster to implement than API routes, have better TypeScript integration with forms, and enable optimistic UI patterns natively.

### When to Use Server Actions vs API Routes

| Scenario | Use |
|---|---|
| Form submission from a React component | Server Action |
| Programmatic data mutation from UI | Server Action |
| External webhook receiver | API Route |
| Integration that needs a stable URL | API Route |
| Background job HTTP trigger | API Route |
| Mobile/third-party API client | API Route |

### Server Action Structure

```typescript
// actions/entities.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { requireOrgContext } from '@/lib/supabase/middleware'
import { z } from 'zod'

const CreateEntityInput = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['competitor', 'investor', 'partner', 'market', 'executive']),
  domain: z.string().url().optional()
})

export async function createEntity(input: z.infer<typeof CreateEntityInput>) {
  const { org, user } = await requireOrgContext() // throws if not authenticated

  const parsed = CreateEntityInput.parse(input) // throws on invalid — correct here
  
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('tracked_entities')
    .insert({ ...parsed, org_id: org.id, created_by: user.id })
    .select('id')
    .single()

  if (error) throw new Error('Failed to create entity')

  revalidatePath('/entities')
  redirect(`/entities/${data.id}`)
}
```

### Rules

- Server Actions always live in `actions/` — never inlined in component files.
- Every action begins with `requireOrgContext()` — this is non-negotiable.
- Actions throw errors rather than returning error objects. The form or caller handles the thrown error.
- After successful mutations, call `revalidatePath()` on any routes that display the mutated data.
- Actions do not contain rendering logic. They mutate, validate, and optionally redirect.

---

## 11. Naming Conventions

### Files and Directories

- All files and directories: `kebab-case`
- No underscores in file names. No PascalCase file names.
- Route group directories: `(group-name)` — Next.js convention
- Dynamic segments: `[param-name]` — Next.js convention

```
✓ signal-card.tsx
✓ entity-detail.tsx
✓ use-feed-filters.ts
✗ SignalCard.tsx
✗ entity_detail.tsx
✗ signalCard.tsx
```

### React Components

- Component functions: `PascalCase`
- Props interfaces: `ComponentNameProps`
- Named exports only — no default exports for components (default exports only for Next.js page files, which require it)

```typescript
// components/feed/signal-card.tsx
export interface SignalCardProps {
  event: IntelligenceEvent
  onDismiss?: (id: string) => void
}

export function SignalCard({ event, onDismiss }: SignalCardProps) {
  // ...
}
```

### Hooks

- Prefix with `use`: `useFeedFilters`, `useEntityTimeline`
- Live in the component directory they serve, or in a shared `hooks/` directory if used across multiple components
- Do not create hooks for things that are better handled by Server Components

### TypeScript

- Types and interfaces: `PascalCase`
- Enums: `PascalCase` with `PascalCase` values
- Generic type parameters: single uppercase letter or descriptive name: `T`, `TData`, `TError`
- Exported type aliases in `types/app.ts`: `PascalCase`

### Database

- Tables: `snake_case`, plural (`tracked_entities`, `intelligence_events`)
- Columns: `snake_case` (`org_id`, `signal_score`, `detected_at`)
- Foreign keys: `{referenced_table_singular}_id` (`entity_id`, `org_id`)
- Indexes: `idx_{table}_{columns}` (`idx_events_org_detected`)
- Policies: descriptive English strings (`"Users can read own org data"`)

### Constants and Environment Variables

- Constants: `SCREAMING_SNAKE_CASE`
- Environment variables: `SCREAMING_SNAKE_CASE` with prefix conventions (see §19)

---

## 12. State Management Philosophy

### Global State Restrictions

Global client-side state is heavily restricted.

Default hierarchy of preference:

1. Server Component data
2. URL/search param state
3. Local component state
4. Server Actions + revalidation
5. Minimal React Context
6. External global state libraries (last resort)

Avoid introducing:

* Zustand
* Redux
* MobX
* excessive React Context
* client-side caching layers

unless there is a demonstrated cross-route synchronization requirement that cannot be solved cleanly with Server Components or URL state.

Most state in this product is server-owned, not client-owned.

The frontend is primarily:

* a rendering layer
* a navigation layer
* an interaction layer

not a client-side application runtime.

Overuse of client-side state causes:

* architectural drift
* hydration complexity
* inconsistent data flow
* cache invalidation problems
* unnecessary client bundle growth


We do not have a global state management library. We do not use Redux, Zustand, Jotai, or MobX. We will not add them without a concrete use case that cannot be solved with the patterns below.

### State Hierarchy

**Server state (database-backed):** Managed by Supabase + Server Components + `revalidatePath`. The canonical source of truth is always the database. UI reflects it; UI does not own it.

**URL state (navigation, filters, search):** Managed via `useSearchParams` and `useRouter`. Filter state, pagination, tab state, and search queries belong in the URL — they are bookmarkable, shareable, and survive refresh.

**Local UI state (transient, component-scoped):** Managed with `useState`. Dropdown open/closed, modal visibility, hover states, form field focus. This state does not need to survive navigation.

**Derived state:** Computed from server state or URL state using `useMemo`. Never stored separately.

### The Test

Before reaching for any state, ask: "Where does this data live in five minutes?" If the answer is "in the database," use server state. If the answer is "in the URL," use URL state. If the answer is "nowhere — it resets on navigation," use local state.

### What We Do Not Do

- We do not cache API responses in client-side state and manage cache invalidation manually. `revalidatePath` + Server Components handle this.
- We do not use React Context for data that changes frequently. Context is for stable configuration (theme, user profile, org context) — not for feed data or entity lists.
- We do not use SWR or React Query unless there is a specific real-time requirement that `revalidatePath` cannot serve. This decision requires explicit justification.

---

## 13. Data Loading Philosophy

**Fetch data as high as possible in the tree, as close to the data source as possible.**

The ideal data flow: database → server component → props → render. Every additional step (fetch layer, transformation layer, context layer, hook layer) adds complexity and potential failure points.

### Loading Patterns

**Page-level fetch (preferred for most cases):**
```typescript
// app/(app)/entities/page.tsx
export default async function EntitiesPage() {
  const entities = await getActiveEntities() // lib function or inline supabase call
  return <EntitiesList entities={entities} />
}
```

**Parallel fetches (for independent data):**
```typescript
export default async function DashboardPage() {
  const [entities, recentEvents, alertCount] = await Promise.all([
    getActiveEntities(),
    getRecentEvents({ limit: 10 }),
    getPendingAlertCount()
  ])

  return (
    <DashboardLayout>
      <MetricCards alertCount={alertCount} entityCount={entities.length} />
      <RecentFeed events={recentEvents} />
      <EntitySidebar entities={entities} />
    </DashboardLayout>
  )
}
```

**Streaming with Suspense (for independent slow operations):**
```typescript
export default async function EntityPage({ params }) {
  return (
    <div>
      <EntityHeader entityId={params.id} />  {/* fast — just name/type */}
      <Suspense fallback={<TimelineSkeleton />}>
        <EntityTimeline entityId={params.id} />  {/* slow — many events */}
      </Suspense>
    </div>
  )
}
```

### What We Avoid

- Fetching data in `useEffect` when a Server Component can fetch it
- Fetching data in client components when a Server Action + revalidation handles the mutation/refresh cycle
- Multiple round-trips for data that can be JOINed or fetched in parallel

---

## 14. Async / Loading / Error State Standards

### Skeleton Loading

Every page that fetches data must have a corresponding skeleton. Skeletons live next to the component they represent:

```
components/feed/
  signal-card.tsx
  signal-feed.tsx
  signal-feed-skeleton.tsx  ← mirrors the layout of signal-feed.tsx
```

Skeletons use Tailwind's `animate-pulse` and match the approximate dimensions of the real content. They do not use spinner icons.

### Error States

Use Next.js `error.tsx` for page-level errors. Use inline error states for partial failures within a page (e.g., a section that fails to load should show an inline error, not crash the page).

```typescript
// app/(app)/entities/[id]/error.tsx
'use client'
export default function EntityError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <p className="text-sm text-muted-foreground">Failed to load entity details</p>
      <button onClick={reset} className="text-sm underline">Try again</button>
    </div>
  )
}
```

### Empty States

Every list or feed view has a defined empty state. Empty states are not errors — they are valid states that communicate something useful.

Empty states include:
- A brief explanation of why it's empty
- A clear action to resolve it (if applicable)
- No sad face emojis, no stock illustrations

### Loading Indicators

- Full-page transitions: Next.js `loading.tsx` with a skeleton
- Inline async operations (form submission): `useTransition` with a disabled button and a subtle spinner on the button
- Background operations: no loading indicator — surface results via feed refresh or alert

---

## 15. Form Handling Standards

Forms are handled with React Hook Form + Zod + Server Actions. This is the standard stack and is not negotiable.

```typescript
// components/entities/add-entity-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { z } from 'zod'
import { createEntity } from '@/actions/entities'

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['competitor', 'investor', 'partner', 'market', 'executive']),
  domain: z.string().url('Must be a valid URL').optional().or(z.literal(''))
})

type FormValues = z.infer<typeof FormSchema>

export function AddEntityForm() {
  const [isPending, startTransition] = useTransition()
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema) })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await createEntity(values)
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Entity'}
      </button>
    </form>
  )
}
```

### Rules

- Every form field has a Zod validation rule.
- Error messages are user-facing strings defined in the Zod schema, not generic "invalid input."
- Submission triggers a Server Action — never a direct API fetch from a form.
- Submit buttons are disabled during submission with a text label change ("Saving...", "Creating...").
- Successful submission either redirects (from the Server Action) or shows a toast (via `sonner` — our one allowed toast library).
- Never use `<form action={serverAction}>` for complex forms — use `form.handleSubmit` for validation feedback before submission.

---

## 16. AI Pipeline Standards

All AI calls go through `lib/ai/claude.ts`. This file is the single import point for the Anthropic SDK. No other file imports from `@anthropic-ai/sdk` directly.

### Pipeline Structure

Each pipeline is a discrete async function in `lib/ai/pipelines/`. A pipeline:
1. Accepts typed, validated inputs
2. Constructs a prompt using a template from `lib/ai/prompts/`
3. Calls the Claude client wrapper
4. Parses the response with a Zod schema
5. Returns typed, validated output

```typescript
// lib/ai/pipelines/classify-event.ts
import { anthropic } from '@/lib/ai/claude'
import { ClassifiedEventSchema, ClassifiedEvent } from '@/lib/ai/schemas/event.schema'
import { CLASSIFY_EVENT_PROMPT } from '@/lib/ai/prompts/classify'

interface ClassifyEventInput {
  content: string
  entityName: string
  entityType: string
}

export async function classifyEvent(input: ClassifyEventInput): Promise<ClassifiedEvent> {
  const prompt = CLASSIFY_EVENT_PROMPT(input)

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip potential markdown code fences before parsing
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  const parsed = ClassifiedEventSchema.safeParse(JSON.parse(cleaned))
  if (!parsed.success) {
    console.error('[classifyEvent] Parse failure:', parsed.error.issues)
    return { event_type: 'other', is_significant: false, confidence: 0, reasoning: 'parse_failed' }
  }

  return parsed.data
}
```

### Prompt Management

Prompts are versioned strings in `lib/ai/prompts/`. They are not inline template literals in pipeline functions.

```typescript
// lib/ai/prompts/classify.ts
import type { ClassifyEventInput } from '@/lib/ai/pipelines/classify-event'

export function CLASSIFY_EVENT_PROMPT({ content, entityName, entityType }: ClassifyEventInput): string {
  return `You are a strategic intelligence analyst. Classify the following content about ${entityName} (${entityType}).

Respond ONLY with valid JSON matching this schema exactly:
{
  "event_type": "pricing_change" | "product_launch" | "hiring_surge" | "funding" | "exec_move" | "partnership" | "other",
  "is_significant": boolean,
  "confidence": number between 0 and 1,
  "reasoning": string (max 150 characters)
}

Content to classify:
${content.slice(0, 3000)}

Important:
- is_significant = true only if this event would materially affect a competitor's strategic position
- Be specific in reasoning — reference what in the content led to your classification
- Respond with JSON only — no explanation, no markdown fences`
}
```

### Model Selection

| Use case | Model |
|---|---|
| Classification (fast, cheap) | `claude-haiku-4-5-20251001` |
| Summarization + implication | `claude-sonnet-4-6` |
| Weekly briefing generation | `claude-sonnet-4-6` |
| Complex strategic analysis | `claude-sonnet-4-6` |

Never use Opus for automated pipeline calls. Reserve it for user-triggered, high-value, one-time operations if needed.

### Rules

- No streaming in background pipeline calls. Use standard completion.
- Always set `max_tokens` explicitly. Never rely on the default.
- Always strip markdown code fences before JSON parsing (`\`\`\`json` and `\`\`\`` patterns).
- Use `safeParse` in pipeline code. Never crash a background job on a parse failure — log and return a safe default.
- Log every pipeline call with its model, input token estimate, and outcome (success/parse_failure/api_error).
- Never pass raw user input directly into a prompt without sanitization (strip null bytes, limit length).

---

## 17. Ingestion Architecture Standards

Ingestion pipelines run in background jobs (Trigger.dev). They are not triggered by user requests directly.

### Ingestion Flow Contract

Every ingestion pipeline follows this exact sequence:

```
FETCH → DIFF → CLASSIFY → (if significant) SUMMARIZE → IMPLY → SCORE → PERSIST → ALERT
```

No step may be skipped. No step may call a step that comes after it in the chain. Each step is a discrete function that can be tested in isolation.

### Source Wrappers

Every external data source has a wrapper in `lib/ingestion/`:

```typescript
// lib/ingestion/crawl.ts
interface CrawlResult {
  url: string
  content: string  // cleaned markdown
  fetchedAt: Date
  success: boolean
  error?: string
}

export async function crawlPage(url: string): Promise<CrawlResult> {
  // Firecrawl API call with error handling
  // Returns normalized markdown content
  // Never throws — returns success: false with error message
}
```

All ingestion wrappers return typed result objects and never throw. Errors are captured in the result and logged. The pipeline decides whether to continue or abort.

### Snapshot Storage

Before processing, the fetched content is stored as a snapshot in Supabase Storage. This enables:
- Diff computation against previous run
- Debugging LLM extraction errors retroactively
- Replay without re-fetching

Snapshots are stored at: `ingestion-snapshots/{org_id}/{entity_id}/{source_type}/{YYYY-MM-DD}.md`

### Deduplication

Before inserting an intelligence event, check for duplicates:
1. Exact URL match within 24 hours → skip
2. Semantic similarity > 0.92 (via embedding cosine distance) → skip
3. Same entity + same event_type within 1 hour → skip (likely the same story from multiple sources)

### Rate Limiting and Backoff

- Maximum 2 concurrent crawls per org
- 500ms delay between crawl requests to the same domain
- Exponential backoff on 429 or 503 responses: 5s, 15s, 45s, then fail the job
- Failed jobs are retried once after 1 hour by Trigger.dev

---

## 18. Schema Evolution Philosophy

The database schema is production data. It is treated with the same discipline as application code.

### Migration Rules

- Every schema change is a migration file in `supabase/migrations/`
- Migration files are named `{timestamp}_{description}.sql` — e.g., `20240115120000_add_signal_score_to_events.sql`
- Migration files are **never edited after they are committed to the main branch**. A committed migration is immutable — like a shipped release.
- Rollback migrations are written separately if a change is reversible
- Never alter column types or drop columns without explicit data migration and team review

### Safe Schema Changes (Expand-Contract Pattern)

For changes to live tables:

1. **Expand:** Add new columns as nullable. Deploy application code that writes to both old and new columns.
2. **Migrate:** Backfill existing rows.
3. **Contract:** Remove old column. Deploy application code that only reads/writes the new column.

Never drop a column or change a type in a single migration that runs on a live table.

### Types Sync

After every migration, run `supabase gen types typescript --local > types/database.ts` and commit the result. This is automated in CI. Do not hand-edit `types/database.ts`.

### Index Policy

- Every foreign key column is indexed
- Every column used in `WHERE` clauses on large tables is indexed
- Every column used in `ORDER BY` on paginated queries is indexed
- Indexes are created in separate migrations from the table creation to avoid locking issues on large tables

---

## 19. Environment Variable Conventions

### Naming

```
NEXT_PUBLIC_*     — exposed to the browser. Must not contain secrets.
SUPABASE_*        — Supabase connection details
ANTHROPIC_*       — Anthropic API keys and config
TRIGGER_*         — Trigger.dev configuration
RESEND_*          — Resend email API
FIRECRAWL_*       — Firecrawl API
EXA_*             — Exa search API
```

### Rules

- `NEXT_PUBLIC_` variables contain no secrets. Ever.
- All secrets live in Vercel environment variables (prod/preview/development environments), not in `.env.local` for any deployed context.
- `.env.local` is for local development only and is gitignored.
- `.env.example` is committed and contains all required variable names with empty or placeholder values.
- Application code validates required environment variables at startup. Never silently fail on a missing env var in production.

```typescript
// lib/utils/env.ts
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
  // ...
}
```

---

## 20. Logging Philosophy

We log for debugging and operational awareness, not for data collection.

### What We Log

- Every AI pipeline call: `[pipeline_name] model=X tokens_est=Y outcome=success|parse_failure|api_error`
- Every ingestion job start/end: `[ingestion:${entityId}] source=${type} result=new_events:N|no_change|error`
- Every alert dispatch: `[alert:dispatch] channel=${channel} event_id=${id} status=sent|failed`
- Every external API error with status code and response body (truncated to 500 chars)

### What We Do Not Log

- Request bodies containing user data
- Full prompt contents in production (they may contain org context)
- Database query results
- Successful routine operations that always succeed

### Log Format

Use structured logging with consistent prefixes:

```typescript
console.log('[classify:event]', { entityId, model: 'claude-haiku', confidence: 0.87, eventType: 'pricing_change' })
console.error('[crawl:fetch]', { url, status: 429, retryAfter: 30 })
```

In production, logs are captured by Vercel's log drain. We do not use a third-party logging service until log volume justifies it (roughly >1M log lines/day).

---

## 21. Abstraction Philosophy

**Every abstraction is a bet that the same pattern will appear at least three times in meaningfully similar contexts.** If you cannot name three current or imminent use cases, do not abstract.

### The Abstraction Test

Before creating a shared utility, hook, or component, answer:
1. Is this already used in more than one place? (If no: don't abstract yet)
2. Will it be used in more than one place within the next sprint? (If no: don't abstract yet)
3. Does the abstraction hide meaningful complexity, or does it just add a layer of indirection? (If just indirection: don't abstract)
4. Can a future engineer find this abstraction without knowing it exists? (If no: reconsider the name and location)

### Inline Until It Hurts

The correct default is to inline logic until the duplication is painful. Premature abstraction is more costly than duplication because it couples unrelated systems, makes refactoring harder, and requires understanding an abstraction layer that may not map cleanly to a new use case.

### What We Abstract Aggressively

- External API integrations (always wrapped — the wrapper hides the vendor's API surface)
- Supabase client creation (always via `lib/supabase/`)
- All LLM calls (always via `lib/ai/claude.ts`)
- Prompt strings (always in `lib/ai/prompts/` — not inline in pipeline code)

### What We Do Not Abstract Until Forced

- Data fetching patterns that look similar but serve different domains
- UI patterns that look similar but have meaningfully different behavior
- Validation schemas that share fields but represent different concepts

---

## 22. Anti-Patterns

These are explicitly forbidden. When spotted in code review, they are blocked without negotiation.

### Architectural Anti-Patterns

**❌ God components** — a single component that fetches data, manages complex state, renders multiple distinct sections, and handles multiple user interactions. Break it apart.

**❌ Prop drilling beyond three levels** — if data is being passed through three+ component levels without being used, it belongs in a context (if stable) or the tree needs to be restructured.

**❌ Data fetching in `useEffect`** — if a Server Component can fetch the data, it should. `useEffect` fetching is a last resort for genuinely client-side-only data needs.

**❌ Inline SQL or raw Supabase queries in component files** — data access belongs in server components at the page level or in `lib/` functions. Never in component files.

**❌ New top-level library additions without review** — adding a new `npm` dependency requires: a documented reason, confirmation that the existing stack cannot solve the problem, and team sign-off. `package.json` is not a scratch pad.

### AI-Specific Anti-Patterns

**❌ Autonomous agents** — we build pipelines with discrete steps, not autonomous agents that decide their own next actions. Every AI call has a defined input, defined output, and defined scope.

**❌ LLM calls in API routes** — LLM calls are slow and expensive. They belong in background jobs, not in synchronous request handlers.

**❌ Raw JSON.parse on LLM output** — always use `safeParse` with a Zod schema. LLMs produce malformed output.

**❌ Hardcoded prompts in pipeline code** — prompts live in `lib/ai/prompts/`. Pipeline code constructs the prompt by calling a function, not by embedding a template literal.

**❌ Streaming completions in background jobs** — streaming is for user-facing UX. Background jobs use standard completions.

### Code Quality Anti-Patterns

**❌ `any` type without a comment explaining why** — `any` is occasionally necessary. When used, it must have a comment: `// any: third-party type is incorrect, tracked in issue #N`

**❌ `// TODO` without an issue reference** — todos without tracking are dead code. Use `// TODO(#123): description`.

**❌ Commented-out code committed to main** — delete it. Git history preserves it if needed.

**❌ Console.log in production code paths** — use structured logging as defined in §20. Ad-hoc console.logs are for local debugging only.

---

## 23. Code Review Standards

### What Gets Reviewed

Every pull request is reviewed before merge to main. No exceptions, including for solo founders. The review catches:

- Convention violations (this document)
- Security issues (especially RLS, env var exposure, input validation)
- Correctness (does it do what the PR description says)
- Complexity (is there a simpler way)

### Review Checklist

**Security**
- [ ] All new routes validate org context
- [ ] All new tables have RLS policies
- [ ] No secrets in code or comments
- [ ] All external input validated with Zod

**Architecture**
- [ ] No `'use client'` on components that could be server components
- [ ] Data fetching at the appropriate level (not in useEffect when a server component would serve)
- [ ] No new lib dependencies without documented justification
- [ ] Module boundaries respected (no cross-domain lib imports)

**AI/Pipelines**
- [ ] LLM calls go through `lib/ai/claude.ts`
- [ ] All LLM outputs validated with Zod `safeParse`
- [ ] Prompts in `lib/ai/prompts/`, not inline
- [ ] No LLM calls in synchronous request handlers

**Database**
- [ ] New tables have migration files
- [ ] `types/database.ts` regenerated if schema changed
- [ ] Foreign keys are indexed
- [ ] `org_id` filter on all multi-tenant queries

### Review Tone

Code review is about the code, not the author. Comments are specific, actionable, and reference this conventions document where applicable. "This violates §6 — queries must select specific columns" is a useful comment. "This is wrong" is not.

---

## 24. AI-Assisted Coding Workflow
### AI-Generated Code Review Standard

AI-generated code is guilty until proven innocent.

Every generated implementation must be reviewed for:

* unnecessary abstraction
* architectural drift
* excessive client-side logic
* fake completeness
* duplicated utilities
* dependency bloat
* improper folder placement
* naming inconsistency
* overengineering
* premature optimization
* hidden complexity

AI tools tend to:

* create abstractions too early
* over-separate logic
* hallucinate enterprise architecture
* generate unnecessary wrappers
* create dead code paths
* introduce excessive dependencies

The responsibility of the engineer is not to generate more code.
The responsibility is to preserve architectural clarity while accelerating implementation velocity.

Reduction is often more valuable than generation.


### Cursor Configuration

The `.cursorrules` file at the project root provides Cursor with persistent context. It references this document and specifies:
- Default to Server Components
- All Supabase access via `lib/supabase/server.ts` or `lib/supabase/client.ts`
- All AI calls via `lib/ai/claude.ts`
- All mutations via Server Actions in `actions/`
- Zod validation on all external data
- shadcn/ui for all primitive components

### How to Use Claude Effectively

**Give Claude architectural context before asking for code:**
> "This is a Next.js 14 App Router + Supabase project. Server Components are the default. Mutations go through Server Actions. See the conventions.md for rules."

**Ask for one discrete thing at a time:**
> "Write a Server Action in `actions/entities.ts` that creates a tracked entity. It should validate input with Zod, require org context, and call `revalidatePath('/entities')` on success."

**Review AI output against this document before accepting it.** AI tools frequently violate:
- Generating `'use client'` when not needed
- Using `select('*')` instead of specific columns
- Fetching data in `useEffect`
- Inlining prompts instead of using the prompts directory
- Adding unnecessary abstraction layers

**Use AI for:**
- Generating Zod schemas from TypeScript types (or vice versa)
- Writing Supabase RLS policies
- Writing migration files
- Drafting prompt strings (then review and refine)
- Generating TypeScript types from database schemas
- Boilerplate server action and API route structure

**Do not use AI for:**
- Architectural decisions — those are human decisions documented here
- Deciding which library to use — the stack is fixed
- Writing complex business logic without human review
- Any prompt that starts with "build me an autonomous agent"

### Keeping This Document Current

This document evolves with the codebase. When a convention changes:
1. Update this document first
2. Update `.cursorrules` to reference the change
3. Apply the change consistently across the existing codebase (do not leave legacy patterns that contradict new conventions)
4. Note the change in the PR description

A codebase where the documentation and the code contradict each other is worse than a codebase with no documentation.
