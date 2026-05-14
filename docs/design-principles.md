# Design Principles

> This document is the product design constitution for this platform. It defines not just what we build, but why it looks and feels the way it does. Every design decision — from a table row height to a color token — has a reason. Deviation from these principles requires a better reason.
>
> This platform is executive-grade strategic intelligence infrastructure. Every design choice must be defensible in that context.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [What We Reject](#2-what-we-reject)
3. [Design References](#3-design-references)
4. [Color System](#4-color-system)
5. [Typography System](#5-typography-system)
6. [Spacing System](#6-spacing-system)
7. [Information Hierarchy](#7-information-hierarchy)
8. [Dashboard Philosophy](#8-dashboard-philosophy)
9. [Table and Feed Philosophy](#9-table-and-feed-philosophy)
10. [Card Usage Philosophy](#10-card-usage-philosophy)
11. [Navigation Philosophy](#11-navigation-philosophy)
12. [Sidebar Philosophy](#12-sidebar-philosophy)
13. [Form Design Philosophy](#13-form-design-philosophy)
14. [Motion Philosophy](#14-motion-philosophy)
15. [Loading State Philosophy](#15-loading-state-philosophy)
16. [Empty State Philosophy](#16-empty-state-philosophy)
17. [Density Philosophy](#17-density-philosophy)
18. [Interaction Philosophy](#18-interaction-philosophy)
19. [Signal Visualization](#19-signal-visualization)
20. [Iconography Philosophy](#20-iconography-philosophy)
21. [Border and Shadow Philosophy](#21-border-and-shadow-philosophy)
22. [Responsive Philosophy](#22-responsive-philosophy)
23. [Accessibility Standards](#23-accessibility-standards)
24. [Enterprise UX Expectations](#24-enterprise-ux-expectations)

---

## 1. Design Philosophy

### The Core Premise

This product is used by people who make decisions with significant stakes — founders allocating capital, chiefs of staff advising executives, GTM leaders choosing competitive positioning. The UI is not decoration. It is an instrument through which serious people access serious information under real time pressure.

The design must earn trust instantly and maintain it through every interaction.

### Sophisticated Minimalism

We practice **sophisticated minimalism** — not the minimalism of barren empty space, but the minimalism of discipline. Every element present is there because it is necessary. Every element absent was removed because its absence is cleaner than its presence.

The distinction between good minimalism and cheap minimalism is richness of what remains. Our UI is not sparse because we ran out of ideas. It is restrained because restraint is harder to achieve than decoration.

### Executive Calm

The dominant emotional register of this product is **calm confidence**. Not excitement. Not delight (in the modern tech startup sense). Not urgency.

The product contains urgency (high-signal alerts, critical competitor moves) but it delivers that urgency through information hierarchy, not through visual agitation. Red badges and prominent placement communicate urgency. Animation, flashing, and color saturation do not — they communicate anxiety.

A founder opening this platform at 7am before a board meeting should feel: *this is a serious tool that respects my time and cognitive load.*

### Visual Trustworthiness

Trust is the product. We are telling users what is happening in their competitive landscape. The UI must communicate that the information is accurate, curated, and reliable.

Visual trustworthiness comes from:
- Precise alignment and spacing (sloppiness signals carelessness)
- Restrained color use (oversaturation signals consumer product, not enterprise tool)
- Excellent typography (readability signals care for the reader)
- Information density appropriate to context (too sparse = toy, too dense = noise)
- Consistency of pattern (unpredictable UI = untrustworthy information)

### What "Premium" Means Here

Premium does not mean gradients, glassmorphism, and custom illustrations. Premium means:
- The right amount of information in the right place
- Spacing that feels intentional, not algorithmic
- Typography that is chosen, not defaulted
- Interactions that respond predictably and instantly
- Zero visual clutter between the user and the information they need

---

## 2. What We Reject

These are explicit rejections, not preferences. They are enforced in design review.

### Rejected Visual Patterns

**❌ Neon gradients** — purple-to-blue gradients, gradient text, gradient borders. These are the signature of undifferentiated AI tooling. We are not undifferentiated AI tooling.

**❌ Glassmorphism as decoration** — frosted glass effects on cards, sidebars, or UI elements that are not overlaying other content. Glassmorphism is acceptable only on modals and popovers that genuinely float over content.

**❌ Cyberpunk/dark mode maximalism** — neon accents on dark backgrounds. Our dark mode is sophisticated charcoal, not a gaming aesthetic.

**❌ Excessive animation** — loading spinners that spin indefinitely, animated backgrounds, scroll-triggered animations on every element, page transitions that take more than 200ms. Motion is meaningful or it is noise.

**❌ Illustration-heavy empty states** — cartoon illustrations, undraw.co SVGs, stock isometric art. Our empty states are typographic and informational.

**❌ Oversaturated accent colors** — bright blue, bright purple, electric teal. Our accents are muted. They communicate without shouting.

**❌ Dashboard clutter** — widgets placed to fill space rather than to serve a purpose. Every element on a dashboard occupies real estate; it must earn that space with clear informational value.

**❌ Dropshadows on everything** — shadows are used for elevation context, not decoration. A card in a list does not need a shadow. A modal does.

**❌ Dribbble-style overdesign** — decorative geometric elements, noise textures as aesthetic choices, oversized headings with arbitrary font mixing. We design for use, not for a design portfolio.

**❌ Excessive card wrapping** — wrapping every piece of information in a card is not information architecture. It is visual inflation. Cards are for bounded objects, not for sections of a page.

### Rejected UX Patterns

**❌ Feature tours on every page** — tooltips that appear unsolicited to explain obvious UI. If the UI needs a tour, the UI failed.

**❌ Confirmation modals for low-stakes actions** — "Are you sure you want to dismiss this alert?" — no. Use undo.

**❌ Optimistic UI without fallback** — never update the UI before confirming server success for consequential operations (deleting an entity, generating a report).

**❌ Infinite scroll without pagination option** — infinite scroll is disorienting for intelligence feeds. Provide both patterns.

**❌ Real-time updates that interrupt reading** — don't inject new feed items into the top of a list while a user is reading it. Queue updates and surface them as a "N new signals" banner.

---

## 3. Design References

We reference these products not to copy them, but to understand the aesthetic category they represent and to hold our own decisions to the same standard.

**Linear** — information density done right. Tight spacing, excellent type hierarchy, no wasted space. The interaction model for keyboard-first, power-user workflows.

**Vercel** — technical credibility expressed visually. Dark mode that is genuinely sophisticated (charcoal, not black). Muted accents. Monospaced data. The feeling of infrastructure, not application.

**Ramp** — financial intelligence for executives. Tables that communicate trust. Dense but readable. Conservative color palette with precise accent use.

**Mercury** — banking for founders. Premium without ostentation. Warm neutrals. Excellent spatial rhythm. Content-forward.

**Notion** — hierarchy through typography, not decoration. Dense information that doesn't feel dense because the spatial rhythm is excellent.

**Arc Browser** — thoughtful interface design for power users. Sidebar done right. Navigation that gets out of the way.

**Bloomberg Terminal** — the extreme reference point. Maximum information density. Everything earns its position through utility. Zero decoration. We don't go this far, but we respect the philosophy.

**Perplexity Enterprise** — AI-native product that doesn't look like an AI product. Clean, citation-forward, professional. The intelligence presentation we aspire to.

---

## 4. Color System

### Philosophy

Color is used for three purposes in this product:
1. **Semantic communication** (signal level, status, type)
2. **Navigation hierarchy** (active states, focus, selection)
3. **Structural separation** (background layers, subtle dividers)

Color is not used for decoration, brand expression on individual UI elements, or differentiation between items that are not meaningfully different.

### Foundation Palette

```css
/* Page foundation */
--color-bg-base: #F7F6F3;          /* warm off-white — the page background */
--color-bg-surface: #FFFFFF;       /* cards, panels, sidebars */
--color-bg-elevated: #F0EFec;      /* hover rows, secondary panels */
--color-bg-sunken: #EBEBEB;        /* input backgrounds, code blocks */

/* Text scale */
--color-text-primary: #1C1B18;     /* near-black — headings, primary content */
--color-text-secondary: #5A5954;   /* body text, labels */
--color-text-tertiary: #9B9892;    /* timestamps, captions, placeholders */
--color-text-quaternary: #C4C2BD;  /* decorative separators, very muted */

/* Borders */
--color-border-subtle: rgba(28, 27, 24, 0.06);
--color-border-default: rgba(28, 27, 24, 0.10);
--color-border-strong: rgba(28, 27, 24, 0.18);
--color-border-focus: rgba(28, 27, 24, 0.35);

/* Semantic */
--color-signal-high: #1A6B40;      /* score 80-100 — muted emerald */
--color-signal-high-bg: #EBF5EF;
--color-signal-med: #9B5800;       /* score 50-79 — muted amber */
--color-signal-med-bg: #FDF3E3;
--color-signal-low: #9B9892;       /* score 0-49 — gray */
--color-signal-low-bg: transparent;

--color-status-active: #1A6B40;
--color-status-paused: #9B9892;
--color-status-error: #9B2020;
--color-status-error-bg: #FDF0F0;

/* Interactive */
--color-accent: #1C1B18;           /* primary action color — near-black */
--color-accent-hover: #3A3935;
--color-link: #2547A3;             /* links and secondary interactive */
--color-link-hover: #1A3580;
```

### Dark Mode

Dark mode is a first-class requirement. The palette inverts to:

```css
@media (prefers-color-scheme: dark) {
  --color-bg-base: #111110;
  --color-bg-surface: #1A1916;
  --color-bg-elevated: #222120;
  --color-bg-sunken: #2A2927;
  --color-text-primary: #E8E6DF;
  --color-text-secondary: #A8A69F;
  --color-text-tertiary: #6A6862;
  --color-border-subtle: rgba(232, 230, 223, 0.06);
  --color-border-default: rgba(232, 230, 223, 0.10);
  --color-border-strong: rgba(232, 230, 223, 0.18);
}
```

Dark mode is not the inverse of light mode with a black background. It is a warm graphite — the difference between a darkroom and a dark hallway. Dark mode text is warm off-white, not pure white.

### Color Rules

- **Never use raw Tailwind color classes** for semantic colors. Use CSS variables so dark mode works automatically.
- **Accent colors are muted.** If a color looks vibrant in a screenshot, it is wrong.
- **Never use more than two accent colors** on a single page. Signal score colors (emerald, amber, gray) count as one system.
- **Background hierarchy has four levels.** Do not invent new background tones — use the four defined levels.
- **Status colors are reserved for status.** Do not use red or green for anything other than error/success or signal level.

---

## 5. Typography System

### Font Selection

**Primary (sans):** Geist Sans — chosen for its technical credibility, excellent legibility at small sizes, and neutral character that does not compete with content. Not Inter (too ubiquitous), not Space Grotesk (overused in AI products).

**Monospace:** Geist Mono — for timestamps, signal scores, IDs, and data values. Monospace data reads more precisely.

**No serif font in the UI.** Serif is reserved for long-form report content if needed. The product UI is sans-serif throughout.

### Type Scale

```css
/* Display — used in empty states, onboarding, major headings */
--text-display: 28px / 1.2 / weight 500

/* Heading 1 — page titles */
--text-h1: 22px / 1.3 / weight 500

/* Heading 2 — section titles, panel headers */
--text-h2: 16px / 1.4 / weight 500

/* Heading 3 — subsection labels, table headers */
--text-h3: 12px / 1.4 / weight 500 / tracking 0.06em / uppercase

/* Body — primary reading content */
--text-body: 14px / 1.6 / weight 400

/* Body small — secondary text, descriptions */
--text-body-sm: 13px / 1.5 / weight 400

/* Caption — timestamps, labels, metadata */
--text-caption: 12px / 1.4 / weight 400

/* Data — monospace numbers and codes */
--text-data: 13px / 1.4 / weight 400 / font-family: Geist Mono
```

### Typography Rules

- **Table column headers:** 12px, uppercase, letter-spacing 0.06em, weight 500, secondary color. This is the only place we use uppercase.
- **Signal scores:** always monospace. Numbers communicate precision; monospace reinforces it.
- **Body text line-height is 1.6.** This is deliberately generous — dense information needs breathing room within paragraphs.
- **No bold within body copy.** Use semantic elements (`<strong>`) only for genuinely critical emphasis, sparingly. Bold is not a substitute for hierarchy.
- **Heading weights are 500, not 700.** 700 weight at small sizes reads as shouting. 500 is authoritative without aggression.
- **Never go below 12px.** 11px and below is inaccessible and signals a design that ran out of space.

---

## 6. Spacing System

We use an **8px base grid**. Every spacing value is a multiple of 4px. Most values are multiples of 8px.

```
4px  — xs: micro-gaps (icon-to-text, badge padding sides)
8px  — sm: tight component gaps (button padding-y, tag gaps)
12px — md: standard component padding (card-to-content, list item padding-y)
16px — lg: section gaps, card padding, input padding
24px — xl: between-section spacing, generous card padding
32px — 2xl: major section separators
48px — 3xl: page section breaks
64px — 4xl: page-level top padding
96px — 5xl: major layout divisions
```

### Spacing Rules

- **Consistent rhythm.** A page with 3 different margin values between similar elements is broken. Choose one and apply it.
- **Generous vertical rhythm.** We err on the side of more vertical space rather than less. Vertical compression is the enemy of legibility.
- **Internal padding is smaller than external margin.** The distance between content inside a card is smaller than the distance between the card and its neighbor.
- **Horizontal padding in tables and lists:** 16px minimum. Tables are not spreadsheets — they need air on the sides.
- **Section headers have 32px above them and 16px below.** The asymmetry visually connects the header to its content.

---

## 7. Information Hierarchy

Information hierarchy is the architecture of meaning. It tells the reader what to look at first, second, and third without requiring them to read everything.

### The Hierarchy Principle

Every view has **one primary element** — the most important piece of information. It is visually dominant. Everything else is secondary or tertiary.

On the feed: the signal title is primary. The implication is secondary. The source and timestamp are tertiary.

On an entity page: the entity name is primary. The last signal is secondary. The metadata (domain, type, date added) is tertiary.

On a report: the executive summary is primary. The event list is secondary. The metadata is tertiary.

### How We Create Hierarchy

1. **Size** — primary text is larger, but only slightly. We do not use 32px titles next to 12px body.
2. **Weight** — primary text is 500. Secondary is 400. Never 700 in the product UI.
3. **Color** — primary is `--color-text-primary`. Secondary is `--color-text-secondary`. Tertiary is `--color-text-tertiary`.
4. **Position** — primary information is in the top-left. Reading pattern is F-shaped; put critical information there.
5. **Contrast** — primary information has higher contrast against the background than secondary.
6. **Space** — primary elements have more space around them.

We never create hierarchy through color saturation, underline, background highlight, or decoration alone.

---

## 8. Dashboard Philosophy
## Dashboard Density Constraints

The dashboard is an operational surface, not a marketing page.

Hard constraints:

* Maximum 3 primary dashboard panels per row
* Avoid nested cards entirely
* Prefer split-pane layouts over excessive card grids
* Default table row height: 48px–56px
* Sidebar width should remain visually compact and stable
* Avoid more than 2 levels of visual containment
* Primary actions should appear once per screen
* Avoid duplicate controls in multiple locations
* Information hierarchy must remain scannable within 3 seconds

Density should feel:

* intentional
* efficient
* breathable
* operational

not:

* sparse
* crowded
* decorative
* widget-heavy

When in doubt:
remove UI before adding more UI.


### The Dashboard is a Command Center, Not a Homepage

The dashboard is not a welcome screen. It is not a status page. It is an operational surface that a founder or chief of staff opens and immediately extracts decision-relevant information from.

It is designed for the user who opens it every morning. Not for the first-time visitor.

### Dashboard Layout Principles

**Top row: four metric cards.** Signals this week. Entities tracked. Alerts pending. Top signal score. These are numbers with one-word labels. No sparklines unless we have 30 days of data and the trend is genuinely informative.

**Left 65%: intelligence feed.** The primary content. Recent signals, filterable, paginated. This is what the user opened the dashboard for.

**Right 35%: entity panel.** Tracked entities with their last signal date and a signal count. Not decorative — it surfaces which entities have been quiet (possible blind spot) and which are active.

**No widgets below the fold on initial load.** If information requires scrolling to find it, it is not dashboard-tier information.

### Dashboard Anti-Patterns

- Charts that show data without communicating a specific insight ("here is your signal count over time" — so what?)
- Metric cards with numbers the user cannot act on
- "Getting started" sections that persist after onboarding is complete
- Calendar widgets, activity heatmaps, or other borrowed patterns from project management tools

---

## 9. Table and Feed Philosophy

Tables and feeds are the primary information surface of this product. They must be excellent.

### Table Design

**Row height:** 52px for standard data rows. 44px for compact mode (user preference). Never below 40px — rows need vertical breathing room for scanning.

**Column headers:**
- 12px, uppercase, letter-spacing 0.06em, weight 500
- `--color-text-tertiary` — muted, they are labels not content
- Sticky on scroll for tables with more than 8 rows

**Cell content:**
- Primary cell: 14px, `--color-text-primary`, weight 400
- Secondary cell: 13px, `--color-text-secondary`
- Numeric/date cell: 13px Geist Mono, right-aligned

**Column separator:** none. We use row separator only (0.5px `--color-border-subtle`).

**Row hover:** `--color-bg-elevated` background. Inline actions (dismiss, open, share) appear on hover.

**No zebra striping.** Alternating row backgrounds reduce the legibility of the hover state and add visual noise.

**Sort indicators:** minimal — a small chevron icon in the column header, visible on hover or when active. Not oversized, not animated.

### Feed Design

The intelligence feed is a chronological list of signal cards. It differs from a table in that each item has asymmetric content — some signals are two lines, some are four.

**Signal card anatomy:**
```
[left border — signal level color, 3px]
[entity name — 12px caption]  [event type badge]  [timestamp — 12px mono]
[signal title — 14px, weight 500, primary color]
[AI implication — 13px, secondary color, max 2 lines]
[source URL — 12px, tertiary, link]
```

**Left border:** 3px colored line on the card left edge communicates signal level at a glance without using saturation or icons. High signal = muted emerald. Medium = muted amber. Low = no border (or very light gray).

**No card shadows in the feed.** Feed items are separated by subtle borders, not elevated as individual cards. Shadow creates visual complexity inappropriate for a list of 20+ items.

**Action revelation:** dismiss, save, and open actions appear on row/card hover. They are not always visible — they would add visual noise to a dense feed.

---

## 10. Card Usage Philosophy

Cards are for **bounded objects** — entities, reports, settings panels. They are not for sections of a page.

### When to Use a Card

✓ A single entity's summary information (entity card)
✓ A report preview (report card)
✓ A settings panel that has a clear boundary
✓ A modal or popover content container
✓ A data record (contact, event detail)

### When Not to Use a Card

✗ A section of a dashboard that happens to have a title
✗ A list item in a dense feed
✗ A navigation section
✗ A heading + some content (this is a section, not a card)

### Card Specification

```css
background: var(--color-bg-surface);
border: 0.5px solid var(--color-border-subtle);
border-radius: 10px;
padding: 16px 20px;
```

No shadow. No hover shadow on non-clickable cards. Clickable cards get a subtle border-color shift on hover.

### Card Anti-Patterns

- Cards inside cards (two levels of card nesting — restructure the layout)
- Cards that contain a full page's worth of content (use a panel or dedicated section)
- Cards with gradient or colored backgrounds (cards are neutral surfaces)

---

## 11. Navigation Philosophy

Navigation exists to answer: "Where am I, and where can I go?" It should answer this question in under one second without conscious effort.

### Navigation Principles

**Persistent sidebar:** The primary navigation is always visible on desktop. It does not collapse to icons without text on screens wider than 1200px.

**Active state is unambiguous:** The current page is clearly indicated. We use a filled background on the current nav item, not just a different text color.

**Navigation depth is maximum two levels:** Top-level items and one sublevel. No fly-out menus, no mega-menus, no deep hierarchies. If the product needs a third navigation level, the information architecture needs to be reconsidered.

**System navigation vs content navigation:** The sidebar handles system navigation (between major product areas). Content navigation (between entities, between reports) happens within the main panel via tabs, breadcrumbs, or inline links.

---

## 12. Sidebar Philosophy

The sidebar is 240px wide on desktop. It is permanent on screens ≥ 1200px. On smaller screens it is a drawer triggered by a hamburger icon.

### Sidebar Anatomy

```
[Logo + org name]
[org switcher button if applicable]

———

INTELLIGENCE (12px label, uppercase, tertiary)
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
  Custom

———

[user avatar + name]
[Settings link]
```

### Sidebar Design Rules

- Section labels are 11px, uppercase, letter-spacing 0.08em, `--color-text-tertiary`. They are organizational, not navigational.
- Nav item text is 14px, `--color-text-secondary` when inactive, `--color-text-primary` when active.
- Active item has `--color-bg-elevated` background, border-radius 8px, slight left padding addition.
- No icons next to nav items (they add visual noise for minimal benefit in a list this short). Exception: if the nav list grows beyond 12 items.
- The sidebar is `--color-bg-surface` — same as cards. It is not a different background tone.
- A subtle 0.5px right border separates the sidebar from the main content area.

---

## 13. Form Design Philosophy

Forms are not exciting. They should be unexciting. The goal of a form is to collect information with minimum cognitive friction.

### Form Layout

- **Single-column forms only** for complex multi-field inputs. Two-column forms are acceptable only for simple paired fields (first name / last name).
- **Label above input, always.** Placeholder-only labeling is inaccessible and visually fragile.
- **Input height:** 38px. Consistent across all form elements.
- **Input border:** 0.5px `--color-border-default`, radius 8px. On focus: `--color-border-focus` with no box-shadow ring (box-shadow rings are jarring in dense UIs).
- **Error state:** red left border (3px) + error message below the field in 12px `--color-status-error`. No background color change on the input.
- **Button placement:** primary action on the right, secondary/cancel on the left. In modals, primary action on the bottom right.

### Form Anti-Patterns

- Required field asterisks with no legend explaining them
- Inline validation that triggers before the user finishes typing (debounce at 500ms minimum)
- Generic error messages ("Something went wrong") — every error has a specific, actionable message
- Forms that clear on submission error (preserve user input)
- Progress bars for forms with fewer than 5 steps

---

## 14. Motion Philosophy

Motion is not decoration. Every animation either communicates a state change or provides spatial context. If the animation serves neither purpose, it is cut.

### Approved Motion Purposes

1. **Skeleton to content transition** — communicates that data has loaded
2. **Modal/sheet enter/exit** — provides spatial context (where did this come from, where did it go)
3. **Dropdown/popover appear** — communicates relationship between trigger and content
4. **Inline action reveal** — communicates that the action is tied to the hovered row
5. **Toast notification enter** — communicates that something happened

### Motion Timing

```css
/* Micro: hover states, active states, badge updates */
--duration-micro: 100ms;
--ease-micro: ease-out;

/* Standard: dropdowns, tooltips, inline reveals */
--duration-standard: 150ms;
--ease-standard: ease-out;

/* Emphasis: modals, sheets, page transitions */
--duration-emphasis: 200ms;
--ease-emphasis: cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* Nothing should take longer than 200ms */
```

### Motion Rules

- **Nothing exceeds 200ms.** Animations that take longer than 200ms feel slow in an information-dense professional tool.
- **Page transitions are opacity fades only.** No slide transitions, no scale transitions, no clip-path animations on page changes.
- **Skeleton loaders do not pulse rapidly.** 2s ease-in-out pulse cycle. Fast pulsing is anxious.
- **Feed item entry is a single 120ms opacity fade.** Not a slide-in. Not a bounce. A fade.
- **Respect `prefers-reduced-motion`.** Wrap all transitions in `@media (prefers-reduced-motion: no-preference)`. When reduced motion is preferred, state changes are instant.
- **No hover animations on text.** Underlines, color changes on hover are fine. Scale, transform, or position changes on text are not.

---

## 15. Loading State Philosophy

Loading states communicate that the product is working, not that the product is broken. They should be calm, predictable, and informative about what is loading.

### Loading Hierarchy

**Page-level loading:** Full skeleton that mirrors the layout of the loaded page. The skeleton shows the same spatial structure as the real content — same columns, same approximate row heights. It does not show random gray bars.

**Section-level loading:** Section-specific skeleton within an otherwise loaded page (via Suspense).

**Inline loading (mutations):** Button text changes to "Saving..." or "Creating..." and the button is disabled. No separate spinner element.

**Background loading:** No indicator. Background jobs (ingestion, report generation) surface their results through the feed or via an alert. They do not show a persistent loading state.

### Skeleton Design

```css
/* Skeleton element */
background: var(--color-bg-sunken);
border-radius: 6px;
animation: pulse 2s ease-in-out infinite;

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

Skeleton widths vary to mimic text: short (60%), medium (80%), long (95%). Not all the same width — that reads as a loading bar, not as a content placeholder.

### What We Never Show

- Circular spinners on loading states that persist more than 3 seconds (use a skeleton)
- "Please wait..." text with a spinner
- Loading progress percentages for operations where we cannot know progress
- A loading state that prevents the user from navigating away

---

## 16. Empty State Philosophy

Empty states are valid states. They communicate something true about the system's current condition. They are not failures to be hidden.

### Empty State Anatomy

```
[Icon — single, simple, Lucide — 24px, tertiary color]
[Primary message — 15px, weight 500, primary color — what is empty and why]
[Secondary message — 13px, secondary color — what the user can do about it]
[Action button — if applicable]
```

### Empty State Writing

The primary message explains the condition: "No competitors tracked yet" or "No signals this week."

The secondary message either explains why ("Add a competitor to start receiving intelligence") or normalizes it ("Signals will appear here as your monitoring rules run").

Never: "Nothing here yet 👀" or "You're all caught up! 🎉" — this is not a consumer social product.

### When to Show Empty States

- A list or feed with zero items (always)
- A search with zero results (always, with the query echoed back)
- A monitored entity with no signals yet (with expected first-run timing)
- A report list with no reports generated (with context about when they generate)

---

## 17. Density Philosophy

This product serves professionals who are comfortable with information density. We do not dumb down the information surface.

### Density Targets

| Surface | Target density |
|---|---|
| Intelligence feed | 8-10 signal cards visible without scroll |
| Entity list | 10-12 entities visible without scroll |
| Report list | 6-8 reports visible without scroll |
| Dashboard | All primary information above the fold |
| Data table | 12-15 rows visible without scroll |

These are targets for a standard 1440×900 viewport. They drive spacing and font size decisions.

### Density Rules

- **Dense layouts require excellent typography.** Reducing space between elements only works if each element is legible on its own. Poor typography at high density is illegible. Good typography at high density is scannable.
- **Density is not compression.** We do not reduce line-height, clip text aggressively, or remove structural white space to achieve density. We achieve density through appropriate (not excessive) margins and focused content.
- **Opt-in density expansion.** Users can expand individual signal cards to see full content. The default is compact.
- **Mobile is exempt.** On mobile, density targets are halved. Comfort takes precedence over density on touch interfaces.

---

## 18. Interaction Philosophy

### Principle: Predictable Before Delightful

Every interaction does exactly what a user who has used this type of software before would expect. We do not introduce surprise interactions, novel patterns, or "delightful" moments that break expectation.

Predictability is not boring — it is professional. A surgeon does not want a scalpel that has a fun custom grip. A founder making strategic decisions does not want a UI that surprises them.

### Interaction Standards

**Click targets:** minimum 36×36px for any interactive element. Never make icons without labels the only interactive affordance for important actions.

**Hover states:** all interactive elements have a visible hover state. The hover state changes within 100ms of cursor arrival.

**Focus states:** all interactive elements have a keyboard focus indicator. The focus ring uses `--color-border-focus` and is 2px — visible but not aggressive.

**Destructive actions:** require two interactions. First interaction: reveals a confirmation with the consequence clearly stated. Second interaction: confirms. Never a single click to delete.

**Copy to clipboard:** always show a visual confirmation (icon changes from copy to check, returns after 2s). No toast for this — it is too lightweight.

### Keyboard Navigation

The product is keyboard-navigable throughout. Specific keyboard shortcuts:
- `K` — open command palette (search + navigation)
- `E` — dismiss focused signal
- `O` — open focused signal's source URL
- `/` — focus search

Command palette is not optional — it is the primary power-user navigation interface. It is built from day one.

---

## 19. Signal Visualization

Signal level is the most important data dimension in the product. It must be communicated clearly and consistently at every surface where signals appear.

### Signal Score Visualization

Signal score is a number from 0-100. It is communicated through:

1. **Left border on signal cards:** 3px solid line — emerald (80+), amber (50-79), none (0-49)
2. **Score badge in tables:** monospaced number, small colored dot to the left — same color scheme
3. **Color of the event type badge** — higher signal types have slightly more prominent badges

We never use a progress bar, a gauge chart, or a spectrum visualization for signal score. Those are too heavy for a list context.

### Event Type Badges

Event types are communicated through small, muted badges:

```
pricing_change     → subtle amber background, "Pricing" label
product_launch     → subtle blue background, "Product" label
hiring_surge       → subtle purple background, "Hiring" label
funding            → subtle green background, "Funding" label
exec_move          → subtle gray background, "Exec Move" label
partnership        → subtle teal background, "Partnership" label
```

Badge background saturation is low — these are labels, not alerts.

### Trend Indicators

When an entity's signal frequency changes materially (e.g., 3x more signals than average week), a subtle trend indicator appears on the entity card. A small upward arrow in the same muted emerald. No animation. No tooltip that appears on every hover.

---

## 20. Iconography Philosophy

We use **Lucide React** exclusively. No mixing of icon libraries. No custom SVG icons except for the product logo.

### Icon Usage Rules

- **Icons accompany labels** in navigation, buttons, and calls to action. Icons without labels appear only in toolbars and action rows where context makes meaning obvious (dismiss = X, open = arrow, save = bookmark).
- **Icon size:** 16px inline with text. 20px for standalone icons in action positions. 24px for empty state icons only.
- **Icon color** matches its text context. Icons do not have independent color.
- **Icons do not convey critical information alone.** Signal level is not communicated solely by a colored icon — it is also communicated by text and structural cues.

### Which Icons We Use

Preferred icons (used consistently to build pattern recognition):

| Action | Icon |
|---|---|
| Dismiss / close | `X` |
| External link | `ExternalLink` |
| Edit | `Pen` |
| Delete | `Trash2` |
| Add | `Plus` |
| Search | `Search` |
| Settings | `Settings2` |
| Alert | `Bell` |
| Filter | `Filter` |
| More options | `MoreHorizontal` |
| Collapse | `ChevronUp` |
| Expand | `ChevronDown` |
| Report | `FileText` |
| Entity | `Building2` |
| Signal | `Zap` |

---

## 21. Border and Shadow Philosophy

### Borders

Borders define structure. We use them minimally — only where a visual separator is necessary to communicate a boundary.

```css
/* Default — most borders */
border: 0.5px solid var(--color-border-subtle);

/* Emphasis — active states, focused elements */
border: 0.5px solid var(--color-border-default);

/* Strong — selected state, high-contrast separation */
border: 0.5px solid var(--color-border-strong);

/* Focus ring — keyboard focus */
outline: 2px solid var(--color-border-focus);
outline-offset: 2px;
```

0.5px borders are deliberate. 1px borders are for applications that need to communicate robustness. 0.5px borders communicate precision and refinement.

### Shadows

```css
/* No shadow — default for cards in lists */
none

/* Popover shadow — for floating elements above content */
box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);

/* Modal shadow */
box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
```

These are the only two shadow values used in the product. There is no "card shadow," no "hover shadow," and no animated shadow.

Shadow is used only for genuine elevation — elements that float above the content layer (modals, popovers, dropdowns). Elements within the content layer do not have shadow.

---

## 22. Responsive Philosophy

This is a desktop-first product. The primary audience uses it on desktop monitors in a professional context. Mobile is supported but not prioritized for complex workflows.

### Breakpoints

```css
/* Desktop — primary design target */
@media (min-width: 1200px) — full sidebar, full density

/* Laptop — common secondary context */
@media (min-width: 900px) — sidebar visible, slightly reduced density

/* Tablet */
@media (min-width: 640px) — sidebar as drawer, reduced columns

/* Mobile */
@media (max-width: 639px) — single column, read-only optimized
```

### Responsive Rules

- The sidebar collapses to a drawer below 1200px. Below 900px it becomes a full-width overlay.
- Multi-column layouts collapse to single column below 900px.
- Table columns are prioritized — less important columns are hidden first on smaller screens (`hidden md:table-cell`).
- Mobile is read-optimized. Complex mutations (adding entities, configuring monitoring rules) are acceptable to hide behind a "better on desktop" prompt on mobile.
- Touch targets are minimum 44×44px on mobile.

---

## 23. Accessibility Standards

Accessibility is not optional. It is a baseline requirement for enterprise software.

### Required Standards

- **WCAG 2.1 AA compliance** for all core flows. This means:
  - Color contrast ratio ≥ 4.5:1 for body text
  - Color contrast ratio ≥ 3:1 for large text (18px+) and UI components
  - All interactive elements are keyboard accessible
  - All images have meaningful alt text or are marked `aria-hidden="true"` for decorative
  - All form inputs have associated `<label>` elements (not just placeholder text)

- **Screen reader support:**
  - Semantic HTML throughout (`<nav>`, `<main>`, `<article>`, `<header>`, `<aside>`)
  - `aria-label` on icon-only buttons
  - `aria-live` regions for dynamic content updates (new feed items, alert counts)
  - Focus management in modals (focus trap, return focus on close)

- **Keyboard navigation:**
  - Tab order follows visual reading order
  - Focus indicators are visible at all times
  - Modals trap focus
  - Dropdowns are dismissible with Escape

### Accessibility Anti-Patterns

- Using `div` or `span` with `onClick` instead of `<button>`
- Color as the only differentiator (signal level must also use shape/text, not just color)
- Auto-playing animations (always require user interaction or respect `prefers-reduced-motion`)
- Dynamic content updates that move focus without user intent

---

## 24. Enterprise UX Expectations

Enterprise users — founders, chiefs of staff, GTM leads — have specific UX expectations developed from years of using professional tools. These expectations are not negotiable.

### What Enterprise Users Expect

**Speed.** If a page takes more than 1.5 seconds to load data, it is too slow. Use skeleton loaders to make it feel faster, but optimize toward actually being faster.

**Reliability.** Enterprise users remember when a tool breaks. One confusing error without recovery is remembered disproportionately. Every error state has a recovery path.

**Configurability.** Not infinite configurability — but the ability to customize what matters. Alert thresholds, feed filters, entity groupings. The product respects that different organizations have different intelligence priorities.

**Export.** Enterprise users export data. Reports are exportable as PDF or structured data. Intelligence events are filterable and exportable. No lock-in.

**Predictability.** The same action has the same result every time. No intermittent failures, no stale cache issues, no race conditions that the user observes.

**Respect for context.** The product does not interrupt the user. Alerts surface in appropriate channels at appropriate times. In-app notifications are dismissible and do not float persistently.

### The Trust Bar

Enterprise software has a higher trust bar than consumer software. A bug in a consumer app is annoying. A bug in an executive intelligence platform raises the question: "Can I trust this information?"

Every design and implementation decision must be evaluated against this question. A loading state that resolves to incorrect data is worse than a loading state that takes 3 seconds. Data integrity is more important than UX delight.

This is why we are conservative with AI-generated content presentation. Every AI-generated summary is attributed to a source. Every implication is framed as an inference. We never present AI output as ground truth.

The product earns trust through consistency, accuracy, and restraint. It keeps trust by never overreaching.
