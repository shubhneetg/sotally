# Sotally V2 — Architecture Document

> **Version:** 2.0.0 | **Last Updated:** 2026-03-18 | **Status:** Draft

## Table of Contents

1. [Executive Summary & Vision Delta](#1-executive-summary--vision-delta)
2. [System Architecture](#2-system-architecture)
3. [AI App Generation Engine](#3-ai-app-generation-engine)
4. [App Runtime & Hosting](#4-app-runtime--hosting)
5. [Creator Storefronts](#5-creator-storefronts)
6. [Social & Community Layer](#6-social--community-layer)
7. [Database Schema V2](#7-database-schema-v2)
8. [Monetization & Business Model](#8-monetization--business-model)
9. [Infrastructure & Deployment](#9-infrastructure--deployment)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Go-To-Market Strategy (Technical)](#11-go-to-market-strategy-technical)
12. [Security, Legal & Compliance](#12-security-legal--compliance)

---

## 1. Executive Summary & Vision Delta

### Vision

Sotally V2 transforms from a tool marketplace into a creator platform where anyone describes software in plain English and receives a fully working, deployed application on their personal storefront (name.sotally.com). The platform dissolves the creator/buyer distinction: every user is a potential creator, every creator is a potential buyer. The goal is to make software creation as accessible as posting on Instagram — type what you want, get a working app, share it with your audience.

### North Star Metric

**Time from signup to first published app: under 5 minutes.**

Every architectural decision in this document is evaluated against that metric. If a design choice adds latency to the creation flow, it must justify its existence.

### V1 vs V2 Comparison

| Dimension | V1 (Tool Marketplace) | V2 (Creator Platform) |
|---|---|---|
| **Core value** | Browse and run pre-built no-code tools | Describe an app in words, get it built and deployed |
| **Creation model** | Developer builds tools using step-based DSL (LLM, HTTP, transform, connector) | Anyone types a prompt; AI generates a full React app |
| **User identity** | Distinct creators vs. buyers | Everyone is a potential creator; roles are fluid |
| **Storefront** | Shared marketplace listing page | Personal subdomain (name.sotally.com) with branding, followers, community |
| **App runtime** | Server-side step execution engine | Client-side sandboxed React apps with optional API backends |
| **Revenue model** | Credits for tool execution | Subscriptions, one-time purchases, freemium — creator chooses |
| **Social layer** | Reviews only | Followers, likes, community feed, creator profiles |
| **Iteration** | Edit step configs in dashboard | Conversational refinement ("add dark mode", "change the chart type") |
| **Distribution** | Marketplace search | Creator's audience, social sharing, SEO on subdomains |
| **Technology** | No-code runner (steps/pipelines) | AI code generation + sandboxed React runtime |

### Five Core Capabilities V2 Requires

1. **AI App Generation Engine** — Accepts natural language, produces deployable React applications. Must handle ambiguity, select appropriate templates, and generate production-quality code.

2. **App Runtime and Sandbox** — Serves generated apps in isolated environments (sandboxed iframes) with controlled access to APIs, storage, and payment primitives. Must prevent malicious code execution.

3. **Storefront and Subdomain Routing** — Each creator gets name.sotally.com with customizable branding, app catalog, follower count, and community feed. The router must handle thousands of subdomains with zero cold-start latency.

4. **Conversational Iteration Loop** — Creators refine apps through natural language after initial generation. The system must maintain app state, understand incremental edits, and regenerate only affected components.

5. **Creator Economy Infrastructure** — Stripe Connect payouts, flexible pricing models (free, one-time, subscription, freemium), analytics dashboard, and follower/community management.

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```
                                    ┌─────────────────────────────┐
                                    │           CDN               │
                                    │  (App bundles, static assets)│
                                    └──────────┬──────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         Caddy Reverse Proxy                              │
│                                                                          │
│  *.sotally.com ──► Storefront Router    app.sotally.com ──► Next.js     │
│  api.sotally.com ──► Hono API           sotally.com ──► Marketing/Next  │
└────┬─────────────────┬──────────────────┬───────────────────────────────┘
     │                 │                  │
     ▼                 ▼                  ▼
┌─────────┐   ┌──────────────┐   ┌──────────────────┐
│Storefront│   │  Next.js 15  │   │    Hono API      │
│ Router   │   │  (app.*)     │   │   (api.*)        │
│          │   │              │   │                  │
│ Resolves │   │ - Dashboard  │   │ - Auth (NextAuth)│
│ subdomain│   │ - App Studio │   │ - CRUD           │
│ → creator│   │ - Feed/Social│   │ - Webhooks       │
│ → serves │   │ - Settings   │   │ - Generation API │
│ storefront│  │              │   │ - App Serving    │
│ page +   │   └──────┬───────┘   └──────┬───────────┘
│ app iframe│          │                  │
└─────────┘           │                  │
                       │    ┌─────────────┴──────────────────┐
                       │    │                                │
                       ▼    ▼                                ▼
              ┌──────────────────┐              ┌───────────────────────┐
              │     Redis        │              │  AI Generation Engine │
              │                  │              │                       │
              │ - Session cache  │              │ ┌───────────────────┐ │
              │ - Rate limiting  │              │ │  Intent Parser    │ │
              │ - App metadata   │              │ ├───────────────────┤ │
              │   cache          │              │ │  App Architect    │ │
              │ - Pub/Sub for    │              │ ├───────────────────┤ │
              │   realtime       │              │ │  Code Generator   │ │
              └──────────────────┘              │ ├───────────────────┤ │
                                                │ │  Validator        │ │
                       │                        │ ├───────────────────┤ │
                       ▼                        │ │  Bundler          │ │
              ┌──────────────────┐              │ └───────────────────┘ │
              │    BullMQ        │              └───────────┬───────────┘
              │                  │                          │
              │ Queues:          │                          │
              │ - generation     │◄─────────────────────────┘
              │ - bundling       │
              │ - deployment     │
              │ - notifications  │
              │ - analytics-agg  │
              └────────┬─────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ PostgreSQL   │ │  MinIO   │ │   Stripe     │
│              │ │  (S3)    │ │              │
│ - Users      │ │          │ │ - Checkout   │
│ - Apps       │ │ - App    │ │ - Connect    │
│ - Storefronts│ │   bundles│ │   (payouts)  │
│ - Social     │ │ - Assets │ │ - Webhooks   │
│ - Executions │ │ - Versions│ │ - Billing   │
│ - Payments   │ │          │ │              │
│ - Analytics  │ └──────────┘ └──────────────┘
└──────────────┘

              ┌──────────────────┐
              │   App Runtime    │
              │   (Sandboxed)    │
              │                  │
              │ - iframe sandbox │
              │ - Sotally SDK    │
              │ - Controlled     │
              │   API bridge     │
              └──────────────────┘
```

### 2.2 Service Communication Table

| From | To | Protocol | Purpose | Auth |
|---|---|---|---|---|
| Next.js | Hono API | HTTPS (REST) | All data operations, generation triggers | JWT (NextAuth) |
| Next.js | Redis | TCP (Pub/Sub) | Real-time generation progress updates | Internal network |
| Hono API | PostgreSQL | TCP (Drizzle) | All persistent data | Connection pool credentials |
| Hono API | Redis | TCP | Session cache, rate limiting, metadata cache | Internal network |
| Hono API | BullMQ | TCP (via Redis) | Enqueue generation, bundling, deployment jobs | Internal network |
| BullMQ Worker | AI Generation Engine | In-process function call | Run generation pipeline | N/A (same process) |
| AI Generation Engine | Claude API | HTTPS | LLM code generation and intent parsing | API key |
| BullMQ Worker | MinIO | HTTPS (S3 API) | Store/retrieve app bundles and versions | Access key + secret |
| BullMQ Worker | PostgreSQL | TCP (Drizzle) | Update app records, generation logs | Connection pool credentials |
| Storefront Router | Redis | TCP | Resolve subdomain → creator ID (cached) | Internal network |
| Storefront Router | MinIO/CDN | HTTPS | Fetch app bundle for serving | Public CDN URL or signed URL |
| App Runtime (iframe) | Hono API | HTTPS (REST) | SDK calls: data storage, auth, payments | App token (scoped JWT) |
| Hono API | Stripe | HTTPS | Payment processing, Connect, webhooks | Stripe secret key |
| Caddy | All services | TCP/HTTP | Reverse proxy, TLS termination, subdomain routing | N/A (infrastructure) |
| CDN | MinIO | HTTPS (origin pull) | Cache app bundles at edge | Origin access identity |

### 2.3 What Is Reusable from V1

**Carry over as-is:**

| Component | Location | Notes |
|---|---|---|
| Monorepo structure | Root `packages/` layout | Add `packages/generation` and `packages/runtime` |
| Auth (NextAuth + JWT) | `packages/api/auth` | Extend with creator profile fields |
| Stripe integration | `packages/api/stripe` | Extend with Connect for creator payouts (partially exists) |
| PostgreSQL + Drizzle | `packages/shared/db` | Add new schemas; existing user/credit schemas stay |
| Redis setup | Docker Compose | Add Pub/Sub channels for generation progress |
| BullMQ infrastructure | `packages/api/workers` | Add new queue types (generation, bundling, deployment) |
| Docker Compose config | Infrastructure | Add MinIO, extend Caddy config for wildcard subdomains |
| Caddy reverse proxy | Infrastructure | Modify for wildcard `*.sotally.com` routing |
| Review system | `packages/shared/db/reviews` | Reuse for app reviews |

**Carry over with modifications:**

| Component | What Changes | Why |
|---|---|---|
| User schema | Add `storefront_slug`, `bio`, `avatar_url`, `follower_count`, `creator_verified` columns | Users become creators with storefronts |
| Credit system | Shift from execution credits to generation credits | V2 monetizes app generation, not app execution |
| Tool schema → App schema | Rename and restructure: tools become apps with source code, bundle URL, version history | Fundamental model change |
| Dashboard (Next.js) | Rebuild most pages; keep layout/auth/settings patterns | New creation flow replaces tool editor |
| Execution engine | Keep as legacy compatibility; new apps use client-side runtime | V1 tools still work, V2 apps are different |

**Retire:**

| Component | Reason |
|---|---|
| No-code step editor UI | Replaced by prompt-based generation |
| Step DSL (LLM step, HTTP step, transform step) | V2 apps are real React code, not pipelines |
| MCP package | Re-evaluate post-launch; not in MVP scope |

### 2.4 New Components Required

#### 2.4.1 AI Generation Engine (`packages/generation`)

**Responsibility:** Accept a natural language prompt and produce a deployable React application bundle.

Sub-components:
- **Intent Parser** — Classifies app type, extracts features, identifies the closest template, determines data model shape.
- **App Architect** — Produces a component tree, state management plan, and API endpoint list. Outputs a structured JSON spec.
- **Code Generator** — Calls Claude API with the spec + selected template, receives React/Tailwind code. Runs multiple passes for components, styles, and logic.
- **Validator** — Static analysis, TypeScript type checking, security scanning (no eval, no external script loading, no data exfiltration).
- **Bundler** — esbuild/Vite to compile the generated React code into a single deployable bundle. Outputs JS bundle + asset manifest.

Detailed design in Section 3.

#### 2.4.2 App Runtime and Sandbox (`packages/runtime`)

**Responsibility:** Execute generated apps safely in user browsers.

- Serves apps inside `<iframe sandbox="allow-scripts allow-forms">` with a strict CSP.
- Provides `@sotally/sdk` — a JavaScript library injected into every app that provides controlled access to: persistent key-value storage (per-app, per-user), authentication state (who is using the app), payment triggers (charge user, check subscription), analytics events.
- The SDK communicates with the Hono API via `postMessage` bridge across the iframe boundary. The parent frame validates every message.
- No direct network access from inside the sandbox. All external calls go through the SDK.

#### 2.4.3 Storefront Router

**Responsibility:** Resolve `name.sotally.com` to the correct creator storefront and serve it.

- Runs as Caddy middleware or a lightweight Go/Node service behind Caddy.
- On request to `*.sotally.com`, extracts subdomain, looks up creator in Redis (falls back to PostgreSQL).
- Returns the creator's storefront page (server-rendered Next.js page with the creator's apps, profile, and social info).
- When a user clicks an app, the storefront loads the app bundle from CDN into a sandboxed iframe.
- Handles 404 for unclaimed subdomains, redirects `www.sotally.com` to `sotally.com`.

#### 2.4.4 Object Storage (MinIO)

**Responsibility:** Store all generated app bundles, assets, and version history.

- S3-compatible API. Runs as a Docker container in dev; can swap to AWS S3 or Cloudflare R2 in production.
- Bucket structure: `apps/{app_id}/v{version}/bundle.js`, `apps/{app_id}/v{version}/manifest.json`, `apps/{app_id}/v{version}/assets/`.
- Versioned: every generation or iteration creates a new version. Creators can roll back.
- CDN sits in front for read performance.

#### 2.4.5 Social Layer (extends `packages/shared/db` + `packages/api`)

**Responsibility:** Followers, likes, community feeds.

- New schemas: `follows(follower_id, following_id, created_at)`, `likes(user_id, app_id, created_at)`, `feed_events(type, actor_id, target_id, metadata, created_at)`.
- API endpoints for follow/unfollow, like/unlike, feed retrieval.
- Redis-backed fan-out for feed generation (write to follower feeds on event).
- Notification queue (BullMQ) for email/push on new follower, new app from followed creator.

#### 2.4.6 Analytics Service (extends `packages/api`)

**Responsibility:** Track app usage, creator dashboards.

- Lightweight event ingestion endpoint: app SDK sends events (app_opened, button_clicked, purchase_completed).
- BullMQ worker aggregates events into daily/weekly rollups in PostgreSQL.
- Creator dashboard shows: app views, unique users, revenue, conversion rate, retention.
- No third-party analytics dependency in MVP; add PostHog or similar later.

---

## 3. AI App Generation Engine

This is the core differentiator. Everything else is infrastructure; this is the product.

### 3.1 Generation Flow

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌───────────────┐
│   Creator    │     │   Intent     │     │      App       │     │     Code      │
│   Prompt     │────►│   Parser     │────►│   Architect    │────►│   Generator   │
│              │     │              │     │                │     │               │
│ "A calorie   │     │ type: tracker│     │ Components:    │     │ React +       │
│  tracker for │     │ features:    │     │  - FoodLog     │     │ Tailwind      │
│  my fitness  │     │  [log,calc,  │     │  - CalCalc     │     │ source code   │
│  clients"    │     │   history]   │     │  - History     │     │               │
└─────────────┘     │ niche:fitness│     │  - Dashboard   │     └───────┬───────┘
                     │ template:    │     │ State: zustand │             │
                     │  tracker     │     │ Data: kv-store │             ▼
                     └──────────────┘     └────────────────┘     ┌───────────────┐
                                                                  │   Validator   │
                                                                  │               │
                                                                  │ - TypeCheck   │
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     │ - Security    │
│  Published   │     │   Bundler    │     │    Preview     │◄────│ - Lint        │
│  on CDN +    │◄────│              │◄────│   Sandbox      │     └───────────────┘
│  Storefront  │     │ esbuild →    │     │               │
│              │     │ bundle.js    │     │ Live in-browser│
└─────────────┘     └──────────────┘     │ preview        │
                                          └────────────────┘
```

#### Step 1: Intent Parser

**Input:** Raw natural language prompt from the creator.

**Process:**
1. Send prompt to Claude with a structured extraction prompt.
2. Extract: `app_type` (tracker, calculator, quiz, generator, planner, diary, dashboard, form, directory, game), `features[]` (list of capabilities), `data_model` (what entities and fields), `ui_style` (minimal, playful, professional, dark), `target_niche` (from the 12 ICPs), `closest_template` (from template library).
3. If the prompt is too vague (confidence < 0.6), return clarifying questions to the creator. Maximum one round of clarification.

**Output:** `AppIntent` — a structured JSON object.

```typescript
interface AppIntent {
  app_type: AppType;
  title: string;
  description: string;
  features: Feature[];
  data_model: Entity[];
  ui_style: UIStyle;
  target_niche: Niche;
  template_id: string | null;
  confidence: number;
  clarification_needed: string[] | null;
}

interface Feature {
  name: string;
  description: string;
  priority: "must" | "nice";
}

interface Entity {
  name: string;
  fields: { name: string; type: string; required: boolean }[];
}
```

**LLM cost:** ~800 input tokens (system prompt + user prompt) + ~400 output tokens. Approximately $0.005 per parse with Claude Sonnet.

#### Step 2: App Architect

**Input:** `AppIntent` + selected template skeleton.

**Process:**
1. Load the closest template's component tree and data flow as a starting point.
2. Send to Claude with an architecture prompt: "Given this intent and this template, produce the component tree, state shape, and data flow."
3. Output a structured spec that the Code Generator can follow deterministically.

**Output:** `AppSpec` — the blueprint.

```typescript
interface AppSpec {
  components: ComponentSpec[];
  routes: RouteSpec[];
  state: StateSpec;
  data_endpoints: DataEndpoint[];
  sdk_features_used: string[]; // ["kv-storage", "auth", "payments"]
  styling: { theme: string; primary_color: string; font: string };
}

interface ComponentSpec {
  name: string;
  file_path: string;       // e.g., "components/FoodLog.tsx"
  props: PropSpec[];
  children: string[];       // child component names
  description: string;      // what this component does (for the LLM)
  state_dependencies: string[];
}
```

**LLM cost:** ~1,500 input tokens + ~1,000 output tokens. Approximately $0.01 per architecture pass.

#### Step 3: Code Generator

**Input:** `AppSpec` + template source code + Sotally SDK type definitions.

**Process:**
1. For each component in the spec, generate React + Tailwind code in a single LLM call per component (batched where possible).
2. Generate the root `App.tsx` with routing and layout.
3. Generate `store.ts` (Zustand state management).
4. Generate any utility functions.
5. Inject `@sotally/sdk` imports for data persistence, auth checks, and payment triggers.

**Strategy: Component-by-component generation, not whole-app-at-once.** This keeps each LLM call focused, reduces hallucination, and enables parallel generation of independent components.

**Output:** A file tree of `.tsx`, `.ts`, and `.css` files in memory.

**LLM cost:** ~2,000 input tokens + ~800 output tokens per component. A typical app has 4–8 components. Total: ~$0.04–$0.08 per app generation.

#### Step 4: Validator

**Input:** Generated source files.

**Checks (in order):**
1. **Syntax check** — Parse all files with `@swc/core` to catch syntax errors. Fast (<100ms).
2. **TypeScript check** — Run `tsc --noEmit` against the generated code with the Sotally SDK types. Catches type mismatches.
3. **Security scan** — AST traversal to reject: `eval()`, `Function()`, `document.cookie` access, `fetch()` or `XMLHttpRequest` (must use SDK), inline `<script>` tags, `import` from external URLs.
4. **Size check** — Reject if generated code exceeds 500KB unminified (likely hallucination or runaway generation).
5. **SDK compliance** — Verify that data persistence uses `sotally.storage.*`, not `localStorage` or `IndexedDB` directly.

**On failure:** Return errors to Code Generator for a single retry pass. If retry also fails, return the errors to the creator with a simplified version of the app.

#### Step 5: Preview Sandbox

**Input:** Validated source files.

**Process:**
1. Bundle with esbuild in-memory (no disk write). Output: a single JS bundle + CSS.
2. Serve via a temporary preview URL: `preview-{id}.sotally.com` (short-lived, 30 minutes TTL).
3. Render in the creator's browser in a sandboxed iframe with the Sotally SDK connected to a temporary data store.
4. Creator sees the live app and can interact with it.

**The preview is where the iteration loop begins** (see Section 3.3).

#### Step 6: Publisher

**Input:** Final validated, bundled app after creator approves.

**Process:**
1. Assign a version number (v1 for new apps, v{n+1} for iterations).
2. Upload bundle + manifest + assets to MinIO at `apps/{app_id}/v{version}/`.
3. Update PostgreSQL: `apps` table with current version, bundle URL, metadata.
4. Invalidate CDN cache for this app.
5. App is now live on the creator's storefront.

**The entire flow (Steps 1–6) targets under 30 seconds for a typical app.** Step 3 (code generation) is the bottleneck at 10–20 seconds for 4–8 components generated in parallel.

### 3.2 App Template System

Templates are the key to speed and quality. The AI does not generate from scratch — it selects the closest template and customizes it.

#### Template Library

| Template ID | Name | Niche Fit | Components | Description |
|---|---|---|---|---|
| `tracker` | Activity Tracker | Fitness, wellness, nutrition | LogEntry, History, Stats, Settings | Log items over time, view trends |
| `calculator` | Smart Calculator | Finance, nutrition, fitness | InputForm, ResultDisplay, History | Take inputs, compute, show result |
| `quiz` | Quiz / Assessment | Education, astrology, coaching | QuestionCard, ProgressBar, Results, ShareCard | Multi-step questionnaire with scored results |
| `generator` | Content Generator | Astrology, content, creative | InputForm, GeneratedContent, SavedItems | Take parameters, generate text/images via LLM |
| `planner` | Planner / Scheduler | Parenting, education, business | Calendar, TaskList, DayView, Settings | Organize items over time |
| `diary` | Journal / Diary | Wellness, parenting, language | EntryEditor, EntryList, MoodTracker, Insights | Daily entries with optional tagging |
| `dashboard` | Data Dashboard | Business, finance, real estate | MetricCard, ChartPanel, FilterBar, DataTable | Visualize data with charts and tables |
| `form` | Smart Form | All niches | FormBuilder, FieldRenderer, SubmissionList, Analytics | Collect structured data from users |
| `directory` | Listing Directory | Real estate, business | SearchBar, ListingCard, DetailView, FilterPanel | Browse and search items |
| `game` | Mini Game / Challenge | Education, fitness, language | GameBoard, ScoreTracker, Leaderboard, Timer | Interactive challenge with scoring |

#### Template Structure

Each template is a real, working React app stored in `packages/generation/templates/{template_id}/`:

```
templates/tracker/
├── template.json          # Metadata: customizable slots, niche mappings
├── src/
│   ├── App.tsx            # Root with routing
│   ├── components/
│   │   ├── LogEntry.tsx   # Has {{ENTITY_NAME}}, {{FIELDS}} slots
│   │   ├── History.tsx
│   │   ├── Stats.tsx
│   │   └── Settings.tsx
│   ├── store.ts           # Zustand store with {{STATE_SHAPE}} slots
│   └── types.ts           # TypeScript interfaces with {{ENTITY}} slots
└── README.md              # What this template does, customization guide
```

Templates use slot markers (`{{SLOT_NAME}}`) for parts the AI will customize. The Code Generator replaces slots with generated code and adds/removes components as needed. This hybrid approach (template scaffolding + AI customization) is far more reliable than pure generation.

#### Template Selection Logic

1. Intent Parser outputs `app_type` and `features[]`.
2. Match `app_type` to template ID directly (90% of cases).
3. If ambiguous, rank templates by feature overlap score.
4. If no template fits (rare), fall back to a minimal `blank` template with just App.tsx and a component shell.

### 3.3 Iteration Loop

After the initial generation, creators refine through conversation. This is where Sotally becomes sticky.

#### Flow

```
Creator: "Add a dark mode toggle"
    │
    ▼
┌─────────────────┐
│  Edit Classifier │  ← Determines: is this a style change, feature add,
│                   │    data model change, bug fix, or full redesign?
└────────┬──────────┘
         │
         ▼
┌─────────────────┐
│  Scope Analyzer  │  ← Determines which files/components are affected.
│                   │    "Dark mode toggle" → App.tsx (theme provider),
│                   │    Settings.tsx (new toggle), store.ts (theme state),
│                   │    all components (Tailwind dark: classes)
└────────┬──────────┘
         │
         ▼
┌─────────────────┐
│  Delta Generator │  ← Generates ONLY the changed code, not the entire app.
│                   │    Uses the current source as context + the edit instruction.
│                   │    Outputs a diff (files to replace or patch).
└────────┬──────────┘
         │
         ▼
┌─────────────────┐
│  Validate + Hot  │  ← Same validator as initial generation.
│  Reload Preview  │    Preview updates in-place (no full rebuild for small changes).
└──────────────────┘
```

#### Edit Classification

| Edit Type | Scope | Regeneration Strategy |
|---|---|---|
| **Style change** ("make it blue", "bigger font") | CSS/Tailwind only | Regex/AST replacement, no LLM call needed for simple cases |
| **Copy change** ("rename 'Calories' to 'Energy'") | String literals | Find-and-replace, no LLM call |
| **Feature addition** ("add a history tab") | New component + route + state | Generate one new component, update App.tsx routing and store |
| **Data model change** ("track protein too") | Types + store + affected components | Regenerate types.ts, store.ts, and components that reference the entity |
| **Layout change** ("move stats to sidebar") | Component arrangement | Regenerate App.tsx layout, possibly component wrappers |
| **Full redesign** ("start over, make it a quiz instead") | Everything | Re-run full generation pipeline with new intent |

**Optimization:** Simple style and copy changes skip the LLM entirely. The system applies deterministic transformations. Only feature additions and data model changes require LLM calls. This keeps iteration fast (under 5 seconds for simple edits) and cheap.

#### Conversation Context

Each app maintains a conversation history:

```typescript
interface AppConversation {
  app_id: string;
  messages: ConversationMessage[];
  current_source: Record<string, string>; // filename → source code
  current_spec: AppSpec;
}

interface ConversationMessage {
  role: "creator" | "system";
  content: string;
  edit_type: EditType | null;
  files_changed: string[] | null;
  version_created: number | null;
  timestamp: Date;
}
```

The conversation history is included in LLM context for delta generation, so the AI understands prior decisions. Context window management: keep the last 20 messages + the current full source. Older messages are summarized.

### 3.4 Technical Implementation

#### LLM Choice

**Primary: Claude Sonnet (latest)** for all generation steps.

Rationale:
- Superior code generation quality compared to alternatives in the 50K-token context range.
- Structured output support (JSON mode) for Intent Parser and App Architect steps.
- Strong instruction following for template-constrained generation.
- Cost-effective at the per-app volume we need.

**Fallback: Claude Haiku** for simple edits (style changes, copy changes) where quality requirements are lower and speed matters more.

**Not using GPT-4o** as primary because: Sotally apps are React + Tailwind, and Claude consistently produces more idiomatic React code in our testing. GPT-4o remains an option for redundancy if Claude API has availability issues.

#### Prompt Engineering Strategy

Three-layer prompt architecture:

**Layer 1: System Prompt (static, per step)**
- Defines the role ("You are a React component generator for Sotally apps")
- Lists constraints (must use Tailwind, must import from @sotally/sdk, no external dependencies)
- Provides the SDK type definitions
- Sets output format (pure code, no markdown fences, no explanations)

**Layer 2: Template Context (per template)**
- The template's README and structure
- Slot descriptions and customization rules
- Examples of good customizations for this template type

**Layer 3: Dynamic Context (per generation)**
- The AppSpec from the Architect step
- The specific component being generated
- The creator's original prompt (for tone/style inference)
- For iterations: the current source code and edit instruction

**Key prompt engineering decisions:**
- Each component is generated in its own LLM call. This prevents cascading errors where a bug in one component causes the AI to "adjust" all other components.
- The system prompt explicitly lists banned patterns (eval, fetch, localStorage) rather than just saying "be secure." Explicit deny-lists work better than abstract instructions.
- Output must be raw TypeScript/TSX. No markdown, no comments like "// ... rest of component." The prompt includes a negative example showing what NOT to do.
- Temperature: 0.2 for code generation (deterministic), 0.6 for intent parsing (needs some creativity to interpret ambiguous prompts).

#### Code Validation and Safety Checks

The validator runs in a sandboxed Node.js worker thread (separate from the API process):

```
Validation Pipeline (sequential, fail-fast):

1. SWC Parse          → Catches syntax errors           [<50ms]
2. TSC Type Check     → Catches type mismatches         [<500ms]
3. AST Security Scan  → Catches banned patterns         [<100ms]
4. Bundle Size Check  → Catches runaway generation      [<10ms]
5. SDK Compliance     → Catches direct browser API use  [<100ms]
                                                    Total: <800ms
```

**Security scan details (AST traversal):**

| Banned Pattern | Detection | Reason |
|---|---|---|
| `eval()`, `Function()` | CallExpression with these names | Arbitrary code execution |
| `fetch()`, `XMLHttpRequest` | CallExpression / NewExpression | Must use SDK for network |
| `document.cookie` | MemberExpression | Cookie theft |
| `localStorage`, `sessionStorage` | MemberExpression | Must use SDK storage |
| `window.open`, `window.location` | MemberExpression + assignment | Navigation hijacking |
| `import()` dynamic imports | ImportExpression | Loading external code |
| `<script>` in JSX | JSXElement with tag name "script" | XSS |
| `dangerouslySetInnerHTML` | JSXAttribute | XSS |
| `iframe` in JSX | JSXElement with tag name "iframe" | Embedding external content |

If validation fails, the Code Generator gets one retry with the error messages injected into the prompt. If the retry also fails, the app is returned to the creator with a "generation failed" message and the specific issues listed. This is rare (<3% of generations based on template-guided approach).

#### Bundle Format: What Is a "Sotally App"?

A Sotally app is a self-contained JavaScript bundle that renders into a DOM container and communicates with the platform through the Sotally SDK.

```
App Bundle Structure (stored in MinIO):
apps/{app_id}/v{version}/
├── bundle.js          # Single esbuild output, all components + React runtime
├── bundle.css         # Extracted Tailwind CSS
├── manifest.json      # Metadata (see below)
├── source/            # Original .tsx/.ts files (for iteration context)
│   ├── App.tsx
│   ├── components/
│   ├── store.ts
│   └── types.ts
└── assets/            # Static assets (icons, images) if any
```

**manifest.json:**
```json
{
  "app_id": "app_abc123",
  "version": 3,
  "title": "Calorie Tracker Pro",
  "description": "Track daily calories with smart suggestions",
  "creator_id": "user_xyz",
  "sdk_version": "1.0.0",
  "sdk_features": ["kv-storage", "auth"],
  "entry_point": "bundle.js",
  "styles": "bundle.css",
  "bundle_size_bytes": 142000,
  "created_at": "2026-04-01T10:30:00Z",
  "template_id": "tracker",
  "generation_model": "claude-sonnet",
  "generation_tokens": 12400
}
```

**How it loads in the browser:**

```html
<!-- Inside sandboxed iframe on the storefront -->
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.sotally.com/apps/{id}/v{v}/bundle.css">
  <script src="https://cdn.sotally.com/sdk/v1/sotally-sdk.js"></script>
</head>
<body>
  <div id="sotally-root"></div>
  <script src="https://cdn.sotally.com/apps/{id}/v{v}/bundle.js"></script>
</body>
</html>
```

The SDK is loaded first and attaches to `window.__sotally`. The app bundle imports from `@sotally/sdk` which resolves to `window.__sotally` via esbuild externals configuration.

#### Version Control

Every generation or iteration creates a new version. The source files are stored alongside the bundle so the iteration loop always has full context.

```
Version History (PostgreSQL):

app_versions table:
  id          | app_id    | version | bundle_url              | source_url           | created_at          | creator_message
  ────────────┼───────────┼─────────┼─────────────────────────┼──────────────────────┼─────────────────────┼─────────────────
  v_001       | app_abc   | 1       | /apps/abc/v1/bundle.js  | /apps/abc/v1/source/ | 2026-04-01 10:30:00 | "Initial generation"
  v_002       | app_abc   | 2       | /apps/abc/v2/bundle.js  | /apps/abc/v2/source/ | 2026-04-01 10:31:00 | "Add dark mode"
  v_003       | app_abc   | 3       | /apps/abc/v3/bundle.js  | /apps/abc/v3/source/ | 2026-04-01 10:33:00 | "Track protein field"
```

**Rollback:** Creator clicks "Revert to v2" in dashboard. System updates the `apps` table `current_version` pointer. No data is deleted. CDN cache is invalidated. Takes under 2 seconds.

**Storage cost per version:** ~150KB average (bundle + CSS + source). At 1,000 apps with 5 versions each: ~750MB. Negligible.

### 3.5 Cost Analysis

#### Per-App Generation Cost

| Step | LLM Tokens (in/out) | Cost (Claude Sonnet) | Compute | Total |
|---|---|---|---|---|
| Intent Parser | 800 / 400 | $0.005 | Negligible | $0.005 |
| App Architect | 1,500 / 1,000 | $0.01 | Negligible | $0.01 |
| Code Generator (6 components avg) | 12,000 / 4,800 | $0.06 | Negligible | $0.06 |
| Validator | 0 / 0 | $0.00 | ~1s CPU | $0.001 |
| Bundler (esbuild) | 0 / 0 | $0.00 | ~2s CPU | $0.001 |
| **Total per new app** | **~14,300 / ~6,200** | **~$0.075** | | **~$0.08** |

#### Per-Iteration Cost

| Edit Type | LLM Tokens | Cost | Notes |
|---|---|---|---|
| Style change (simple) | 0 | $0.00 | Deterministic transform, no LLM |
| Copy change | 0 | $0.00 | Find-and-replace |
| Feature addition | ~4,000 / ~1,500 | $0.02 | One new component + routing update |
| Data model change | ~6,000 / ~2,500 | $0.03 | Types + store + 2-3 affected components |
| Full redesign | Same as new app | $0.08 | Re-runs full pipeline |

#### Monthly Cost Projections

| Scale | New Apps/Month | Iterations/Month | LLM Cost | Storage (MinIO) | Total |
|---|---|---|---|---|---|
| Launch (100 creators) | 500 | 2,000 | $80 | $0.50 | ~$80 |
| Growth (1,000 creators) | 5,000 | 20,000 | $800 | $5 | ~$805 |
| Scale (10,000 creators) | 50,000 | 200,000 | $8,000 | $50 | ~$8,050 |

#### Unit Economics

At the growth stage (1,000 active creators):
- Average generation cost: $0.08 per app.
- If creators pay $10/month (or platform takes 15% of app revenue), the LLM cost per creator is ~$0.80/month.
- **LLM cost is approximately 8% of revenue per creator.** This is sustainable.
- At scale, volume discounts on Claude API and caching of common template patterns can reduce this to 4-5%.

#### Cost Optimization Levers

1. **Template pre-rendering** — For the most common app types (tracker, calculator, quiz), pre-generate 3-5 variants per template. If the intent matches closely, skip the Code Generator step entirely and just customize slots. Saves ~75% of LLM cost for common cases.
2. **Prompt caching** — Claude's prompt caching feature caches the system prompt and template context across calls. Since these are identical for all apps of the same template, this reduces input token costs by ~40%.
3. **Haiku for simple edits** — Route style changes and copy changes through Claude Haiku (10x cheaper) when they do require an LLM call.
4. **Generation result caching** — If two creators request very similar apps ("calorie tracker" vs "food calorie counter"), the second generation can start from the first's output. Similarity detected by embedding the prompt and checking cosine distance against recent generations.

---


---

## 4. App Runtime & Hosting

This section defines how AI-generated apps execute, what security guarantees they receive, and how the platform provides common infrastructure to every app without requiring creators to manage servers.

### 4.1 Runtime Architecture

Generated apps are not server processes. They are pre-built static bundles (HTML + JS + CSS) served from CDN, with optional serverless API routes for server-side logic. Every app is addressable at a deterministic URL derived from its creator and slug.

**URL scheme:**

```
https://creator.sotally.com/app-slug      (subdomain storefront)
https://sotally.com/apps/creator/app-slug  (canonical path, SEO fallback)
https://custom-domain.com/app-slug         (custom domain, same rewrite)
```

**Request flow:**

```
Browser Request
      |
      v
+------------------+
| Cloudflare CDN   |  <-- static assets (JS/CSS/images) served here
| (edge cache)     |      cache-control: public, max-age=31536000, immutable
+------------------+      (content-hashed filenames)
      |
      | (HTML shell / SSR)
      v
+------------------+
| Next.js Edge     |  <-- middleware.ts rewrites subdomain to
| Middleware        |      /apps/[creator]/[slug] route
+------------------+
      |
      v
+------------------+
| Next.js SSR      |  <-- renders app shell page with:
| /apps/[c]/[s]    |      - OG meta tags (for sharing)
|                  |      - App manifest (permissions, data schema)
+------------------+      - Iframe loader OR direct mount
      |
      v
+------------------+       +------------------+
| App Iframe       | <---> | Sotally SDK      |
| (sandboxed)      |       | (postMessage     |
|                  |       |  bridge)          |
+------------------+       +------------------+
      |                           |
      v                           v
+------------------+       +------------------+
| App Bundle       |       | Platform API     |
| (static JS/CSS)  |       | /api/app-runtime |
| from R2/S3       |       | (auth, data,     |
+------------------+       |  analytics, pay) |
                           +------------------+
```

**How it works step by step:**

1. User visits `creator.sotally.com/my-app`
2. Next.js middleware (already exists in V1 -- `packages/web/src/middleware.ts`) rewrites to `/apps/creator/my-app`
3. The SSR page fetches the app record from the `apps` table, renders SEO meta tags and the app shell
4. The app shell loads the app bundle inside a sandboxed iframe, injecting the Sotally SDK
5. The app bundle executes client-side React code, communicating with platform services exclusively through the SDK bridge
6. Any server-side API routes defined by the app are proxied through `/api/app-runtime/[appId]/[...path]` and executed as serverless functions

**V1 middleware extension:** The existing middleware already handles subdomain rewriting for creator storefronts. V2 adds a nested path layer -- `creator.sotally.com/app-slug` rewrites to `/apps/[creator]/[slug]` instead of just `/creators/[username]`.

### 4.2 App Sandbox Model

Apps run inside iframes with a strict security boundary. No app can access another app's data, read the parent page's DOM, or make arbitrary network requests.

**Iframe sandbox attributes:**

```html
<iframe
  src="https://app-runtime.sotally.com/run/[appId]/[version]"
  sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
  allow="clipboard-write"
  csp="default-src 'self' https://sdk.sotally.com; 
       script-src 'self' 'unsafe-inline' https://sdk.sotally.com;
       connect-src https://api.sotally.com;
       img-src * data: blob:;
       style-src 'self' 'unsafe-inline';
       font-src 'self' https://fonts.gstatic.com;"
/>
```

**Why a separate origin for app runtime:** App bundles are served from `app-runtime.sotally.com`, not `sotally.com`. This means even with `allow-same-origin`, the iframe cannot read cookies, localStorage, or session tokens from the main Sotally domain. The SDK bridge is the only communication channel.

**SDK bridge protocol (postMessage):**

```
Parent (sotally.com)                    Iframe (app-runtime.sotally.com)
       |                                        |
       |  <--- { type: 'SDK_READY' }            |  (app loaded)
       |                                        |
       |  ---> { type: 'SDK_INIT',              |  (parent sends context)
       |         payload: {                     |
       |           appId, userId, theme,        |
       |           permissions                  |
       |         }}                             |
       |                                        |
       |  <--- { type: 'SDK_CALL',              |  (app requests service)
       |         id: 'req-1',                   |
       |         method: 'data.get',            |
       |         args: { key: 'settings' }}     |
       |                                        |
       |  ---> { type: 'SDK_RESPONSE',          |  (parent responds)
       |         id: 'req-1',                   |
       |         result: { theme: 'dark' }}     |
       |                                        |
```

**SDK methods available to apps:**

| Category | Method | Description |
|----------|--------|-------------|
| Auth | `sotally.user.get()` | Current user info (id, name, avatar) |
| Auth | `sotally.user.isAuthenticated()` | Boolean login check |
| Data | `sotally.data.get(key)` | Read from app's key-value store |
| Data | `sotally.data.set(key, value)` | Write to app's key-value store |
| Data | `sotally.data.delete(key)` | Delete a key |
| Data | `sotally.data.list(prefix?)` | List keys (with optional prefix filter) |
| Data | `sotally.table.query(table, filter)` | Query a simple table (see 4.3) |
| Data | `sotally.table.insert(table, row)` | Insert into a simple table |
| Analytics | `sotally.analytics.track(event, props)` | Custom analytics event |
| Payments | `sotally.payments.requestPayment(opts)` | Trigger Stripe checkout |
| Payments | `sotally.payments.checkAccess()` | Check if user has paid/subscribed |
| UI | `sotally.ui.showToast(msg)` | Platform-level toast notification |
| UI | `sotally.ui.resize(height)` | Request iframe resize |
| AI | `sotally.ai.complete(prompt, opts)` | LLM inference (metered) |
| AI | `sotally.ai.stream(prompt, opts)` | Streaming LLM inference |

**Permission model:** Each app declares required permissions in its `manifest.json`. The platform prompts the end-user on first use (similar to mobile app permissions). An app that only needs data storage never gets access to `sotally.ai.*` methods.

```json
// manifest.json permissions example
{
  "permissions": ["data:read", "data:write", "analytics:track"],
  "optional_permissions": ["ai:complete", "payments:request"]
}
```

### 4.3 Shared Services Layer

Every app automatically gets access to platform-managed infrastructure. Creators never provision databases, set up auth, or configure analytics.

**Auth (Sotally SSO):**

End-users of apps authenticate through Sotally's existing NextAuth system (V1 `users` table). When a user visits an app, the SDK bridge passes their identity. Apps see a read-only user object -- they cannot modify the user's Sotally account.

- Unauthenticated users can use apps that allow it (permission: `auth:optional`)
- Apps requiring login redirect through the platform's OAuth flow
- The app never sees the user's password, email, or payment details unless explicitly granted

**Data persistence:**

Two tiers of storage, building on V1's existing `tool_user_data` table pattern:

1. **Key-Value Store** (simple, per-app-per-user): Extends the V1 `tool_user_data` concept. Each app gets an isolated namespace. Maximum 1000 keys per user per app, 100KB per value.

2. **Simple Tables** (structured, per-app): For apps that need relational data (e.g., a task manager needs a `tasks` table). The app declares table schemas in `manifest.json`. The platform creates isolated PostgreSQL schemas per app.

```
Per-app data isolation:

+------------------------------------------+
| PostgreSQL                               |
|                                          |
|  schema: public (platform tables)        |
|    - users, apps, follows, etc.          |
|                                          |
|  schema: app_<appId_short>               |
|    - _kv  (key-value store)              |
|    - tasks (app-defined table)           |
|    - entries (app-defined table)          |
|                                          |
|  schema: app_<anotherAppId>              |
|    - _kv                                 |
|    - scores                              |
+------------------------------------------+
```

Table schema definition in manifest:

```json
{
  "data": {
    "tables": {
      "tasks": {
        "columns": {
          "title": { "type": "text", "required": true },
          "done": { "type": "boolean", "default": false },
          "priority": { "type": "integer", "default": 0 },
          "due_date": { "type": "timestamp" }
        },
        "indexes": ["due_date"],
        "row_level_security": true
      }
    }
  }
}
```

When `row_level_security` is true (default), users can only read/write their own rows. The platform enforces this at the query layer -- the app cannot bypass it.

**Analytics:**

Every app automatically tracks:
- Page views (app opens)
- Unique users per day/week/month
- Session duration
- Custom events sent via `sotally.analytics.track()`

Analytics data flows to a shared `app_analytics_events` table, partitioned by month. Creators see aggregated dashboards; they never see individual user data unless the user consents.

**Payments:**

Creators configure pricing on their app (free, one-time purchase, subscription). The existing V1 Stripe Connect infrastructure (`creatorPayouts`, `toolSubscriptions`, `toolLicenses`) is reused directly -- `apps` replaces `tools` as the purchasable entity.

- `sotally.payments.requestPayment()` opens a Stripe Checkout session
- The platform handles Stripe webhooks, records the transaction, and unlocks access
- Revenue split: platform takes X%, creator receives rest via Stripe Connect transfer

**AI (LLM inference):**

Apps can call LLM models through the platform's proxy. This prevents API key leakage and enables metering.

- Calls are proxied through `/api/app-runtime/[appId]/ai`
- The platform deducts credits from the creator's balance (not the end-user)
- Rate limits: 10 req/min per user per app (configurable by creator)
- Models available: whatever the platform supports (OpenAI, Anthropic, etc.)
- Streaming supported via SSE through the SDK bridge

### 4.4 App Bundle Format

A compiled Sotally App is a directory with a deterministic structure, stored in object storage (Cloudflare R2 or S3).

```
app-bundles/
  <appId>/
    <version>/                    # semver, e.g., "1.0.0"
      manifest.json               # metadata, permissions, data schema
      index.html                  # entry point (single-page app shell)
      assets/
        app.[contenthash].js      # compiled React bundle
        app.[contenthash].css     # styles
        vendor.[contenthash].js   # shared deps (React, etc.) -- deduped
      api/                        # serverless API routes (optional)
        handlers.js               # compiled API handlers
        routes.json               # route definitions
      static/                     # user-uploaded assets
        logo.png
        font.woff2
```

**manifest.json full schema:**

```json
{
  "name": "Meal Planner Pro",
  "slug": "meal-planner-pro",
  "version": "1.2.0",
  "description": "AI-powered weekly meal planning",
  "sdk_version": "1.0",
  "entry": "index.html",
  "permissions": ["data:read", "data:write", "ai:complete"],
  "optional_permissions": ["payments:request"],
  "data": {
    "kv": { "max_keys": 100, "max_value_size": "50KB" },
    "tables": {
      "meals": {
        "columns": {
          "name": { "type": "text", "required": true },
          "calories": { "type": "integer" },
          "day": { "type": "text" },
          "week_of": { "type": "timestamp" }
        },
        "row_level_security": true
      }
    }
  },
  "api": {
    "routes": [
      { "method": "POST", "path": "/generate-plan", "handler": "api/handlers.generatePlan" }
    ],
    "timeout_ms": 30000
  },
  "display": {
    "icon": "static/logo.png",
    "screenshots": ["static/screenshot-1.png", "static/screenshot-2.png"],
    "color": "#4f46e5",
    "category": "health-wellness"
  },
  "limits": {
    "max_bundle_size": "5MB",
    "max_api_routes": 10,
    "ai_calls_per_user_per_day": 50
  }
}
```

**Build pipeline (how prompts become bundles):**

```
User Prompt
    |
    v
AI Generation Engine (Section 3)
    |
    v
Generated Source Code (React + optional API)
    |
    v
+-------------------+
| Build Pipeline    |
| (isolated Docker) |
|                   |
| 1. npm install    |
| 2. vite build     |
| 3. validate       |
|    manifest       |
| 4. security scan  |
|    (no eval,      |
|     no external   |
|     script tags)  |
| 5. bundle to R2   |
+-------------------+
    |
    v
app-bundles/<appId>/<version>/
```

**Security scanning during build:**
- No `eval()`, `new Function()`, or `document.write()` allowed
- No external `<script>` tags (all code must be bundled)
- No direct `fetch()` to non-Sotally domains (must use SDK proxy)
- CSP headers are injected into `index.html` at build time
- Maximum bundle size: 5MB (JS + CSS + static assets)

### 4.5 Performance & Scaling

**Static asset delivery:**

| Layer | Strategy | TTL |
|-------|----------|-----|
| Cloudflare CDN | Content-hashed filenames, immutable cache | 1 year |
| Edge cache | index.html per app version | 5 minutes |
| Browser | Service worker for offline-capable apps | Until new version |

**Cold start optimization:**

- App shells are SSR'd by Next.js -- the iframe loads after the page is interactive
- Popular app bundles are preloaded on Cloudflare edge (KV-based popularity ranking)
- The SDK JS (~8KB gzipped) is loaded from a shared CDN path, cached across all apps
- React and common dependencies are extracted into a shared vendor chunk -- if a user has visited any Sotally app, the vendor chunk is already cached

**Concurrent user limits:**

| App Tier | Concurrent Users | API Rate Limit | Data Storage |
|----------|-----------------|----------------|--------------|
| Free | 100 | 60 req/min | 10MB KV, 1 table |
| Pro | 10,000 | 600 req/min | 1GB KV, 10 tables |
| Business | 100,000 | 6,000 req/min | 10GB KV, unlimited tables |

Limits are enforced at the API gateway level. The static bundle itself has no concurrency limit (it is just files on CDN). Limits apply to API routes and SDK service calls.

**Serverless API routes:**

- App API handlers run as edge functions (Cloudflare Workers or Vercel Edge Functions)
- Maximum execution time: 30 seconds
- Maximum request body: 1MB
- Cold start: <50ms (V8 isolates, not containers)
- Each app's API routes are deployed to a dedicated worker namespace for isolation

---

## 5. Creator Storefronts

Storefronts are the public face of every creator on Sotally. They are NOT separate deployments -- they are SSR routes within the main Next.js application, rendered dynamically based on subdomain or path.

### 5.1 Storefront Architecture

**Routing (building on V1 middleware):**

The existing V1 middleware (`packages/web/src/middleware.ts`) already handles subdomain-to-path rewriting. V2 extends this to support app sub-paths:

```
Request: creator.sotally.com/
  -> rewrite to /creators/[username]          (storefront home)

Request: creator.sotally.com/meal-planner
  -> rewrite to /apps/[username]/[slug]       (app page)

Request: creator.sotally.com/posts
  -> rewrite to /creators/[username]/posts    (community feed)

Request: custom-domain.com/
  -> lookup domain in custom_domains table
  -> rewrite to /creators/[username]
```

Updated middleware logic (pseudocode extending the existing implementation):

```
if (hostname is subdomain of sotally.com) {
  username = hostname.split('.')[0]
  if (pathname === '/' || pathname matches storefront routes) {
    rewrite to /creators/{username}{pathname}
  } else {
    // Assume it's an app slug
    rewrite to /apps/{username}{pathname}
  }
}
```

**Storefront route structure in Next.js:**

```
packages/web/src/app/
  creators/
    [username]/
      page.tsx              <-- storefront home (SSR)
      apps/page.tsx         <-- all apps gallery
      posts/page.tsx        <-- community feed
      collections/page.tsx  <-- curated collections
      layout.tsx            <-- storefront shell (header, theme, nav)
      opengraph-image.tsx   <-- dynamic OG image generation
  apps/
    [username]/
      [slug]/
        page.tsx            <-- app detail + embedded runner
        layout.tsx          <-- app-specific SEO, breadcrumbs
        opengraph-image.tsx <-- dynamic OG image for app
```

**Custom domain support:**

V1 already has a `custom_domains` table with `domain`, `verified`, and `creatorId` columns. The verification flow:

1. Creator adds domain in storefront settings
2. Platform returns a TXT record to add: `_sotally-verify=<token>`
3. A background job checks DNS every 5 minutes for pending domains
4. Once verified, Caddy/Cloudflare automatically provisions TLS via Let's Encrypt
5. Middleware routes the custom domain to the creator's storefront

### 5.2 Storefront Features

**Creator profile header:**
- Avatar (from `users.avatarUrl`), display name, bio (from `creatorProfiles.bio`)
- Verified badge (from `creatorProfiles.verified`)
- Social links (from `creatorProfiles.socialLinks` -- already a JSONB field)
- Follow button with live follower count (V1 already has `follows` table)
- Creator level badge (bronze/silver/gold/platinum from `creatorProfiles.level`)
- "Creator since" date

**App gallery:**
- Grid layout showing published apps with generated thumbnails
- Each card: app name, description (truncated), icon, usage count, rating, pricing badge
- Sort options: newest, most popular, highest rated
- Filter by category (reuses V1 `categories` table)
- Pinned/featured apps appear at the top (ordered by `storefrontApps.sortOrder`)

**Collections:**
- V1 already has `toolCollections` and `collectionTools` tables
- Rename conceptually to "App Collections" -- same schema, different entity name
- Creators curate themed groups: "My Fitness Apps", "Getting Started", "Premium Suite"

**Community feed:**
- Creator posts updates visible on their storefront
- Post types: text, announcement (new app launch), milestone (reached X users)
- End-users can comment on posts
- Feed is chronological with pagination

**Storefront customization:**

Stored in a new `storefrontSettings` JSONB column on `creatorProfiles`:

```json
{
  "theme": {
    "primaryColor": "#4f46e5",
    "accentColor": "#f59e0b",
    "darkMode": true
  },
  "layout": "grid",          // "grid" | "list" | "showcase"
  "bannerUrl": "https://...",
  "pinnedAppIds": ["uuid-1", "uuid-2"],
  "showMetrics": true,
  "customCss": null           // future: allow custom CSS for pro creators
}
```

The storefront page reads these settings at SSR time and applies them as CSS custom properties on the layout wrapper. No separate theme engine needed -- just CSS variables.

### 5.3 Storefront Data Model

**Existing V1 tables reused directly:**

| Table | Usage in V2 Storefronts |
|-------|------------------------|
| `users` | Creator identity (name, avatar, email) |
| `creator_profiles` | Bio, specialization, social links, level, verified status |
| `follows` | Follower relationships (composite PK: follower_id + creator_id) |
| `tool_collections` / `collection_tools` | App collections (rename tools -> apps conceptually) |
| `custom_domains` | Custom domain mapping for storefronts |
| `categories` | App categorization |
| `reviews` | App reviews and ratings |

**New/modified tables for V2:**

```sql
-- Extend creator_profiles (add column via migration)
ALTER TABLE creator_profiles
  ADD COLUMN username VARCHAR(50) UNIQUE,      -- for subdomain: username.sotally.com
  ADD COLUMN storefront_settings JSONB DEFAULT '{}',
  ADD COLUMN banner_url VARCHAR(500),
  ADD COLUMN follower_count INTEGER DEFAULT 0,  -- denormalized for perf
  ADD COLUMN app_count INTEGER DEFAULT 0;       -- denormalized for perf

-- Apps table (replaces tools for V2, or parallel table)
CREATE TABLE apps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES users(id),
  slug            VARCHAR(255) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     VARCHAR(500) NOT NULL,
  long_description TEXT,
  icon_url        VARCHAR(500),
  category_id     UUID REFERENCES categories(id),
  tags            TEXT[],

  -- App-specific fields (not in V1 tools)
  bundle_version  VARCHAR(50),                  -- current deployed version
  bundle_url      VARCHAR(500),                 -- R2/S3 path to bundle
  manifest        JSONB,                        -- parsed manifest.json
  source_prompt   TEXT,                         -- original generation prompt
  thumbnail_url   VARCHAR(500),                -- auto-generated screenshot

  -- Pricing (reuse V1 pattern)
  pricing         JSONB DEFAULT '{"model":"free"}',

  -- SEO
  seo_title       VARCHAR(70),
  seo_description VARCHAR(160),

  -- Status & metrics
  status          app_status DEFAULT 'draft',   -- draft/published/suspended/archived
  is_featured     BOOLEAN DEFAULT false,
  total_users     INTEGER DEFAULT 0,
  total_sessions  INTEGER DEFAULT 0,
  avg_rating      DECIMAL(3,2),
  sort_order      INTEGER DEFAULT 0,            -- for storefront pinning

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(creator_id, slug)
);

CREATE INDEX apps_creator_idx ON apps(creator_id);
CREATE INDEX apps_status_idx ON apps(status);
CREATE INDEX apps_category_idx ON apps(category_id);

-- App versions (parallel to V1 tool_versions)
CREATE TABLE app_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id       UUID NOT NULL REFERENCES apps(id),
  version      VARCHAR(50) NOT NULL,
  bundle_url   VARCHAR(500) NOT NULL,
  manifest     JSONB NOT NULL,
  changelog    TEXT,
  source_diff  TEXT,                            -- what changed from previous version
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**Drizzle ORM schema (following V1 conventions):**

```typescript
// packages/api/src/db/schema/apps.ts

export const appStatusEnum = pgEnum('app_status', [
  'draft', 'generating', 'building', 'published', 'suspended', 'archived'
]);

export const apps = pgTable('apps', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').notNull().references(() => users.id),
  slug: varchar('slug', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  longDescription: text('long_description'),
  iconUrl: varchar('icon_url', { length: 500 }),
  categoryId: uuid('category_id').references(() => categories.id),
  tags: text('tags').array(),
  bundleVersion: varchar('bundle_version', { length: 50 }),
  bundleUrl: varchar('bundle_url', { length: 500 }),
  manifest: jsonb('manifest'),
  sourcePrompt: text('source_prompt'),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  pricing: jsonb('pricing').default({ model: 'free' }).notNull(),
  seoTitle: varchar('seo_title', { length: 70 }),
  seoDescription: varchar('seo_description', { length: 160 }),
  status: appStatusEnum('status').default('draft').notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  totalUsers: integer('total_users').default(0).notNull(),
  totalSessions: integer('total_sessions').default(0).notNull(),
  avgRating: decimal('avg_rating', { precision: 3, scale: 2 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('apps_creator_slug_idx').on(table.creatorId, table.slug),
  index('apps_creator_idx').on(table.creatorId),
  index('apps_status_idx').on(table.status),
]);
```

### 5.4 SEO Strategy

**Per-page SEO targets:**

| URL | Title Pattern | Description | Structured Data |
|-----|--------------|-------------|-----------------|
| `creator.sotally.com` | `{Name} - Apps on Sotally` | Creator bio (truncated to 160 chars) | Person + ProfilePage |
| `creator.sotally.com/app-slug` | `{App Name} by {Creator}` | App description | SoftwareApplication |
| `sotally.com/explore/wellness` | `Wellness Apps - Sotally` | Category description | CollectionPage |

**Dynamic OG images:**

V1 already has OG image generation at `/api/og/[slug]/route.tsx`. V2 extends this:

- `/api/og/creator/[username]` -- creator profile card (avatar, name, app count, follower count)
- `/api/og/app/[creator]/[slug]` -- app card (thumbnail, name, description, rating)

Generated using `@vercel/og` (ImageResponse API) at the edge. Cached for 1 hour.

**Technical SEO:**

- All storefront pages are SSR (not client-side rendered) -- search engines see full content
- `sitemap.ts` (already exists in V1) extended to include:
  - All creator storefront URLs: `creator.sotally.com`
  - All published app URLs: `creator.sotally.com/app-slug`
  - Category pages: `sotally.com/explore/[category]`
- `robots.ts` (already exists) allows indexing of all public storefronts and apps
- Canonical URLs always point to the subdomain version (not the path fallback)
- `hreflang` not needed initially (English only)

**Schema.org structured data (JSON-LD):**

```json
// On app pages
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Meal Planner Pro",
  "description": "AI-powered weekly meal planning",
  "applicationCategory": "HealthApplication",
  "author": {
    "@type": "Person",
    "name": "Sarah Chen",
    "url": "https://sarah.sotally.com"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "128"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

---

## 6. Social & Community Layer

The social layer transforms Sotally from a tool directory into a creator platform. V1 already has foundational social tables (`follows`, `toolCollections`, `reviews`). V2 extends these with community features, discovery, and a notification system.

### 6.1 Social Features

**Follow system (V1 reuse):**

The `follows` table already exists with the exact schema needed:

```
follows (composite PK)
  follower_id  -> users.id
  creator_id   -> users.id
  created_at
```

V2 additions:
- Denormalized `follower_count` on `creator_profiles` (updated via trigger or application-level increment)
- `following_count` on `users` for the user's profile
- Follow activity generates a notification to the creator (see 6.3)

**Likes / Saves:**

Users can like apps (public signal) and save them to personal collections (private organization).

```
app_likes (composite PK: user_id + app_id)
  user_id   -> users.id
  app_id    -> apps.id
  created_at

app_saves (composite PK: user_id + app_id)
  user_id       -> users.id
  app_id        -> apps.id
  collection_id -> tool_collections.id (nullable, defaults to "Saved")
  created_at
```

Likes increment a denormalized `like_count` on the `apps` table. The count is used in discovery ranking.

**Reviews and ratings (V1 reuse):**

The `reviews` table already exists:

```
reviews
  id, tool_id, user_id, rating (1-5), comment, created_at
  UNIQUE(tool_id, user_id)  -- one review per user per app
```

For V2, `tool_id` is replaced/aliased to `app_id` (migration renames the column or a new `app_reviews` table mirrors the structure). Reviews are only allowed from users who have actually used the app (verified via `app_analytics_events` or session records).

**Share system:**

Apps and creator profiles generate shareable social cards:
- Twitter/X card: uses the dynamic OG image from 5.4
- Embeddable widget: `<iframe src="https://sotally.com/embed/[creator]/[slug]" />` (V1 already has `/embed/[slug]`)
- Copy link button with UTM tracking: `?ref=[userId]` for affiliate/referral credit
- QR code generation (client-side, no server dependency)

**Creator posts (community feed):**

Creators publish updates on their storefront. This is a lightweight blog, not a full CMS.

```
creator_posts
  id            UUID PK
  creator_id    -> users.id
  type          post_type_enum ('text', 'announcement', 'milestone', 'changelog')
  title         VARCHAR(255)
  body          TEXT (markdown)
  app_id        -> apps.id (nullable, for app-specific posts)
  pinned        BOOLEAN DEFAULT false
  like_count    INTEGER DEFAULT 0
  comment_count INTEGER DEFAULT 0
  published_at  TIMESTAMPTZ
  created_at    TIMESTAMPTZ
```

**Comments:**

Comments are used on both apps (as a discussion thread) and creator posts.

```
comments
  id            UUID PK
  user_id       -> users.id
  target_type   VARCHAR(20)  -- 'app' | 'post'
  target_id     UUID         -- app.id or creator_posts.id
  parent_id     -> comments.id (nullable, for threaded replies)
  body          TEXT
  like_count    INTEGER DEFAULT 0
  is_creator    BOOLEAN DEFAULT false  -- denormalized: is the commenter the app/post creator?
  created_at    TIMESTAMPTZ

INDEX(target_type, target_id, created_at)
INDEX(parent_id)
```

Maximum nesting depth: 2 levels (comment -> reply, no deeper). This keeps the UI simple and the queries fast.

### 6.2 Discovery & Marketplace

**Homepage sections:**

```
sotally.com/
  |
  +-- Hero: "Describe it. Build it. Ship it." + prompt input
  |
  +-- Trending Apps (last 7 days, ranked by session growth rate)
  |
  +-- Featured Creators (hand-curated + algorithmically boosted)
  |
  +-- Category Grid (top 8 categories with app counts)
  |
  +-- New This Week (chronological, published_at DESC)
  |
  +-- Rising Creators (fastest follower growth in last 30 days)
```

**Ranking algorithm for trending apps:**

```
score = (sessions_7d * 0.4) 
      + (new_users_7d * 0.3) 
      + (likes_7d * 0.2) 
      + (avg_rating * 0.1)

-- Recalculated hourly via background job
-- Stored in a materialized view or Redis sorted set
```

**Search:**

Full-text search across apps and creators using PostgreSQL `tsvector`:

```sql
ALTER TABLE apps ADD COLUMN search_vector TSVECTOR;

CREATE INDEX apps_search_idx ON apps USING gin(search_vector);

-- Updated via trigger on INSERT/UPDATE:
UPDATE apps SET search_vector = 
  setweight(to_tsvector('english', name), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'C');
```

Search query:

```sql
SELECT *, ts_rank(search_vector, plainto_tsquery('english', $1)) AS rank
FROM apps
WHERE status = 'published'
  AND search_vector @@ plainto_tsquery('english', $1)
ORDER BY rank DESC, total_sessions DESC
LIMIT 20;
```

No external search engine (Elasticsearch, Typesense) needed at this scale. PostgreSQL full-text search handles the first 100K apps comfortably. Migration path to Typesense later if needed.

**Category / niche pages:**

V1's `categories` table (with `parentId` for hierarchy) supports niche pages:

```
sotally.com/explore                   -- all categories
sotally.com/explore/wellness          -- category page
sotally.com/explore/wellness/fitness  -- sub-category
```

Each category page shows:
- Top apps in that category (by score)
- Featured creators in that niche
- Related categories
- "Create an app in this category" prompt suggestion

**Recommendations:**

Phase 1 (simple, no ML):
- "Users who used this also used..." -- based on co-occurrence in `app_analytics_events`
- "More by this creator" -- same `creator_id`
- "Similar apps" -- same category + overlapping tags

Phase 2 (future):
- Collaborative filtering based on usage patterns
- Content-based similarity using app descriptions (embeddings)

### 6.3 Notifications System

**Architecture:**

```
Event Source          Notification Service          Delivery Channels
                                                         
+----------+         +--------------------+         +----------+
| Follow   |-------->|                    |-------->| In-App   |
| Like     |         |  Event Handler     |         | (DB +    |
| Comment  |-------->|                    |         |  WebSocket|
| New App  |         |  1. Create notif   |-------->| Email    |
| Milestone|-------->|     record in DB   |         | (queue)  |
| Payout   |         |  2. Push to WS     |-------->| Push     |
+----------+         |  3. Queue email    |         | (PWA)    |
                     |  4. Queue push     |         +----------+
                     +--------------------+
```

**Notification types and their triggers:**

| Type | Trigger | Recipients | Channels |
|------|---------|-----------|----------|
| `new_follower` | User follows a creator | Creator | In-app |
| `new_app` | Creator publishes an app | All followers | In-app, email |
| `app_milestone` | App reaches 100/1K/10K users | Creator | In-app, email |
| `new_review` | User reviews an app | Creator | In-app |
| `new_comment` | Comment on app/post | Creator + thread participants | In-app |
| `comment_reply` | Reply to a comment | Parent comment author | In-app, push |
| `payout_ready` | Earnings available for payout | Creator | In-app, email |
| `app_featured` | App selected as featured | Creator | In-app, email |
| `weekly_digest` | Weekly creator stats summary | Creators with apps | Email |

**Existing V1 `notifications` table -- reused directly:**

```
notifications
  id        UUID PK
  user_id   -> users.id
  type      VARCHAR(100)     -- matches types above
  title     VARCHAR(255)
  body      TEXT
  data      JSONB            -- { appId, creatorId, commentId, etc. }
  read      BOOLEAN
  created_at
```

This table is already sufficient. V2 adds:

```sql
ALTER TABLE notifications
  ADD COLUMN channel VARCHAR(20) DEFAULT 'in_app',  -- 'in_app', 'email', 'push'
  ADD COLUMN sent_at TIMESTAMPTZ,                    -- when email/push was actually sent
  ADD COLUMN group_key VARCHAR(255);                 -- for batching (e.g., "new_follower:2024-03-18")
```

**Real-time delivery (WebSocket):**

The V1 Hono API already supports WebSocket connections. Notifications are pushed to connected clients immediately:

```
Client connects: wss://api.sotally.com/ws?token=<jwt>
Server sends:    { type: "notification", payload: { id, type, title, body, data } }
Client acks:     { type: "notification_read", id: "..." }
```

**Email delivery:**

- Emails are queued in Redis (V1 already has `packages/api/src/lib/redis.ts` and `packages/api/src/lib/queue.ts`)
- A worker processes the queue and sends via a transactional email provider (Resend, Postmark, or SES)
- Users configure email preferences: per-type opt-in/opt-out stored in a `notification_preferences` JSONB column on `users`
- Batch/digest: `weekly_digest` type aggregates the week's stats into a single email, sent Sunday evenings

**Push notifications (PWA):**

```sql
CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,    -- public key
  auth        TEXT NOT NULL,    -- auth secret
  user_agent  VARCHAR(500),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

Push is registered via the Web Push API when users opt in. The service worker (`packages/web/public/sw.js`) handles incoming push events and shows native notifications.

### 6.4 Data Model for Social (Complete Schema)

All new tables for the V2 social layer, in Drizzle ORM format following V1 conventions:

```typescript
// packages/api/src/db/schema/social-v2.ts

import { pgTable, pgEnum, uuid, varchar, text, integer, 
         boolean, timestamp, jsonb, index, primaryKey, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { apps } from './apps';

// ---- Existing V1 tables (no changes needed) ----
// follows          -- reuse as-is
// toolCollections  -- reuse as-is (rename to appCollections in code, table stays)
// collectionTools  -- reuse as-is
// reviews          -- reuse as-is (add app_id column via migration)
// notifications    -- reuse as-is (add channel, sent_at, group_key columns)

// ---- New tables ----

// App likes
export const appLikes = pgTable('app_likes', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  appId: uuid('app_id').references(() => apps.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.appId] }),
]);

// App saves (to collections)
export const appSaves = pgTable('app_saves', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  appId: uuid('app_id').references(() => apps.id, { onDelete: 'cascade' }).notNull(),
  collectionId: uuid('collection_id').references(() => toolCollections.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.appId] }),
]);

// Creator posts (community feed)
export const postTypeEnum = pgEnum('post_type', [
  'text', 'announcement', 'milestone', 'changelog'
]);

export const creatorPosts = pgTable('creator_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: postTypeEnum('type').default('text').notNull(),
  title: varchar('title', { length: 255 }),
  body: text('body').notNull(),
  appId: uuid('app_id').references(() => apps.id, { onDelete: 'set null' }),
  pinned: boolean('pinned').default(false).notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('creator_posts_creator_idx').on(table.creatorId),
  index('creator_posts_published_idx').on(table.publishedAt),
]);

// Comments (polymorphic: on apps or posts)
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  targetType: varchar('target_type', { length: 20 }).notNull(), // 'app' | 'post'
  targetId: uuid('target_id').notNull(),
  parentId: uuid('parent_id'), // self-referencing for replies (max depth: 2)
  body: text('body').notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  isCreator: boolean('is_creator').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('comments_target_idx').on(table.targetType, table.targetId),
  index('comments_parent_idx').on(table.parentId),
  index('comments_user_idx').on(table.userId),
]);

// Comment likes
export const commentLikes = pgTable('comment_likes', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.commentId] }),
]);

// Post likes
export const postLikes = pgTable('post_likes', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: uuid('post_id').references(() => creatorPosts.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.postId] }),
]);

// Push notification subscriptions
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique('push_sub_unique').on(table.userId, table.endpoint),
  index('push_sub_user_idx').on(table.userId),
]);

// App analytics events (partitioned by month in production)
export const appAnalyticsEvents = pgTable('app_analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  appId: uuid('app_id').references(() => apps.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 64 }),
  event: varchar('event', { length: 100 }).notNull(), // 'page_view', 'session_start', custom
  properties: jsonb('properties'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('analytics_app_idx').on(table.appId),
  index('analytics_event_idx').on(table.event),
  index('analytics_created_idx').on(table.createdAt),
]);

// Notification preferences (per-user, per-type)
export const notificationPreferences = pgTable('notification_preferences', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 100 }).notNull(), // matches notification type
  inApp: boolean('in_app').default(true).notNull(),
  email: boolean('email').default(true).notNull(),
  push: boolean('push').default(false).notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.type] }),
]);
```

**Entity relationship summary:**

```
users ----< follows >---- users (as creators)
  |                          |
  |----< app_likes >----< apps >----< app_versions
  |                          |
  |----< app_saves           |----< reviews
  |                          |
  |----< comments            |----< app_analytics_events
  |       |
  |       +----< comment_likes
  |
  |----< notifications
  |
  |----< notification_preferences
  |
  |----< push_subscriptions

creator_profiles ---- users (1:1)
  |
  +----< creator_posts ----< post_likes
                       ----< comments (target_type='post')

tool_collections ----< collection_tools (reused as app collections)
```

**Migration strategy:**

V1 tables are preserved. No destructive migrations. The approach:

1. Add new tables (`apps`, `creator_posts`, `comments`, `app_likes`, etc.) alongside existing ones
2. Add new columns to existing tables (`creator_profiles.username`, `notifications.channel`, etc.)
3. Create a view or alias layer so V1 code continues to work with `tools` while V2 code uses `apps`
4. Data migration: existing `tools` rows can optionally be copied to `apps` if creators want to convert their V1 tools into V2 apps

This ensures zero downtime and full backward compatibility during the transition period.


---

## 7. Database Schema V2

### 7.1 Schema Changes from V1

The V2 schema reflects the fundamental shift from "tool marketplace" to "creator platform." Most V1 tables survive but are renamed or extended. No data is dropped — everything migrates forward.

| V1 Table | V2 Outcome | Nature of Change |
|---|---|---|
| `users` | `users` | Modified — remove `role` enum, add storefront fields |
| `tools` | `apps` | Renamed + heavily extended (generation metadata, pricing model, bundle storage) |
| `executions` | `app_sessions` | Renamed + restructured (end-user sessions, not tool runs) |
| `credits` | `credits` | Unchanged — still the internal currency |
| `credit_transactions` | `credit_transactions` | Unchanged |
| `credit_purchases` | `credit_purchases` | Unchanged |
| `subscriptions` | `subscriptions` | Extended — now covers both platform Pro and per-app subscriptions |
| `creators` | Merged into `users` | Every user is a potential creator; earnings fields move to `users` |
| `reviews` | `reviews` | Unchanged, foreign key retargeted `tool_id` → `app_id` |
| `social` (followers) | `social` | Unchanged |
| `notifications` | `notifications` | Unchanged |
| — | `app_versions` | **New** — immutable version history per app |
| — | `app_data` | **New** — per-app key-value persistent storage for end-users |
| — | `app_generations` | **New** — tracks every AI generation request, prompt, token cost |
| — | `creator_posts` | **New** — storefront feed/announcements |

### 7.2 Core Tables (Drizzle ORM TypeScript)

All schemas use Drizzle's `pgTable` syntax. Only new and modified tables are shown in full; unchanged V1 tables (credits, credit_transactions, etc.) retain their existing definitions.

```typescript
// src/db/schema/users.ts

import { pgTable, uuid, text, timestamp, boolean, integer, numeric } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Auth (unchanged from V1)
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),               // null for OAuth-only users
  googleId: text('google_id').unique(),
  avatarUrl: text('avatar_url'),
  displayName: text('display_name').notNull(),

  // Storefront (NEW in V2 — replaces separate `creators` table)
  storefrontSlug: text('storefront_slug').unique(),   // e.g. "dansmith" → dansmith.sotally.com
  bio: text('bio'),                                   // max 500 chars, enforced at app layer
  bannerUrl: text('banner_url'),                      // S3/R2 URL for storefront hero image
  websiteUrl: text('website_url'),
  socialLinks: text('social_links'),                  // JSON string: { twitter, github, youtube }

  // Creator earnings (migrated from V1 `creators` table)
  earningsBalanceCents: integer('earnings_balance_cents').default(0).notNull(),
  lifetimeEarningsCents: integer('lifetime_earnings_cents').default(0).notNull(),
  stripeConnectId: text('stripe_connect_id'),         // for payouts
  payoutThresholdCents: integer('payout_threshold_cents').default(1000).notNull(),

  // Platform subscription
  planTier: text('plan_tier', { enum: ['free', 'pro', 'business'] }).default('free').notNull(),
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
  stripeSubscriptionId: text('stripe_subscription_id'),

  // Metadata
  creditBalance: integer('credit_balance').default(0).notNull(),
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

```typescript
// src/db/schema/apps.ts

import { pgTable, uuid, text, timestamp, boolean, integer, numeric, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const apps = pgTable('apps', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Identity
  slug: text('slug').notNull(),                       // unique per creator, used in URL
  name: text('name').notNull(),
  description: text('description'),                   // short description for cards
  longDescription: text('long_description'),           // markdown, shown on app detail page
  iconUrl: text('icon_url'),
  screenshotUrls: jsonb('screenshot_urls').$type<string[]>().default([]),
  category: text('category'),                          // free-text for now, structured later
  tags: jsonb('tags').$type<string[]>().default([]),

  // Generation metadata
  originalPrompt: text('original_prompt').notNull(),   // what the creator typed
  currentVersionId: uuid('current_version_id'),        // FK to app_versions, set after first build
  generationCount: integer('generation_count').default(1).notNull(),

  // Pricing
  pricingModel: text('pricing_model', {
    enum: ['free', 'one_time', 'subscription', 'credits_per_use']
  }).default('free').notNull(),
  priceAmountCents: integer('price_amount_cents'),            // for one_time
  subscriptionMonthlyAmountCents: integer('sub_monthly_cents'), // for subscription
  creditsPerUse: integer('credits_per_use'),                  // for credits_per_use model

  // Runtime config
  requiresAuth: boolean('requires_auth').default(false).notNull(),
  hasAiFeatures: boolean('has_ai_features').default(false).notNull(),
  aiModelPreference: text('ai_model_preference'),      // e.g. "gpt-4o-mini", "claude-haiku"
  maxAiCallsPerSession: integer('max_ai_calls_per_session').default(20),

  // Stats (denormalized for fast reads — updated by background job)
  totalSessions: integer('total_sessions').default(0).notNull(),
  totalRevenueCents: integer('total_revenue_cents').default(0).notNull(),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }),
  reviewCount: integer('review_count').default(0).notNull(),
  followerCount: integer('follower_count').default(0).notNull(),

  // Status
  status: text('status', {
    enum: ['generating', 'draft', 'published', 'unlisted', 'suspended']
  }).default('draft').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  creatorIdx: index('apps_creator_id_idx').on(table.creatorId),
  slugCreatorIdx: index('apps_slug_creator_idx').on(table.creatorId, table.slug).using('btree'),
  statusIdx: index('apps_status_idx').on(table.status),
  categoryIdx: index('apps_category_idx').on(table.category),
}));
```

```typescript
// src/db/schema/app_versions.ts

import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { apps } from './apps';
import { users } from './users';

export const appVersions = pgTable('app_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  appId: uuid('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),

  // Version identity
  versionNumber: integer('version_number').notNull(),  // auto-increment per app: 1, 2, 3...
  label: text('label'),                                // optional human label: "Added dark mode"

  // Bundle storage
  bundleUrl: text('bundle_url').notNull(),             // R2 URL to the compiled app bundle (.tar.gz)
  bundleHash: text('bundle_hash').notNull(),           // SHA-256 of the bundle for integrity checks
  bundleSizeBytes: integer('bundle_size_bytes').notNull(),

  // Source (for re-generation and debugging)
  sourceSnapshot: jsonb('source_snapshot').$type<{
    files: Record<string, string>;                     // filename → content (for small apps)
    entryPoint: string;                                // main file
    framework: string;                                 // "react", "vanilla", "vue"
    dependencies: Record<string, string>;              // package.json deps
  }>(),

  // Generation linkage
  generationId: uuid('generation_id'),                 // FK to app_generations that produced this version
  prompt: text('prompt'),                              // the prompt that produced this specific version

  // Metadata
  changelog: text('changelog'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

```typescript
// src/db/schema/app_data.ts

import { pgTable, uuid, text, timestamp, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { apps } from './apps';

export const appData = pgTable('app_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  appId: uuid('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),

  // Scoping: data can be global to the app or scoped to a specific end-user
  userId: uuid('user_id'),                            // null = app-global data, non-null = user-scoped
  namespace: text('namespace').notNull().default('default'), // app-defined namespace for partitioning

  // Storage
  key: text('key').notNull(),
  value: jsonb('value').notNull(),                     // arbitrary JSON

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  lookupIdx: index('app_data_lookup_idx').on(table.appId, table.userId, table.namespace, table.key),
  uniqueEntry: unique('app_data_unique').on(table.appId, table.userId, table.namespace, table.key),
}));
```

```typescript
// src/db/schema/app_generations.ts

import { pgTable, uuid, text, timestamp, integer, jsonb, numeric } from 'drizzle-orm/pg-core';
import { apps } from './apps';
import { users } from './users';

export const appGenerations = pgTable('app_generations', {
  id: uuid('id').defaultRandom().primaryKey(),
  appId: uuid('app_id').references(() => apps.id, { onDelete: 'set null' }),  // null for failed initial generations
  creatorId: uuid('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Request
  type: text('type', {
    enum: ['initial', 'iterate', 'fix_bug', 'add_feature', 'restyle']
  }).notNull(),
  prompt: text('prompt').notNull(),                    // the user's natural language request
  systemContext: jsonb('system_context'),               // injected context (existing app source, error logs, etc.)

  // LLM details
  model: text('model').notNull(),                      // "claude-sonnet-4-20250514", "gpt-4o", etc.
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  totalTokens: integer('total_tokens'),
  llmCostCents: integer('llm_cost_cents'),             // actual cost in cents (for unit economics)
  creditsCharged: integer('credits_charged').notNull(), // credits deducted from creator

  // Result
  status: text('status', {
    enum: ['queued', 'processing', 'building', 'succeeded', 'failed']
  }).default('queued').notNull(),
  resultVersionId: uuid('result_version_id'),          // FK to app_versions if succeeded
  errorMessage: text('error_message'),
  errorCode: text('error_code'),                       // structured error: "SYNTAX_ERROR", "BUILD_FAILED", etc.

  // Timing
  queuedAt: timestamp('queued_at', { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMs: integer('duration_ms'),
});
```

```typescript
// src/db/schema/app_sessions.ts

import { pgTable, uuid, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { apps } from './apps';
import { users } from './users';

export const appSessions = pgTable('app_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  appId: uuid('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),  // null for anonymous

  // Session data
  versionId: uuid('version_id').notNull(),             // which app version was served
  ipHash: text('ip_hash'),                             // hashed IP for rate limiting, never raw
  userAgent: text('user_agent'),
  referrer: text('referrer'),

  // AI usage within this session (for metered billing)
  aiCallCount: integer('ai_call_count').default(0).notNull(),
  aiTokensUsed: integer('ai_tokens_used').default(0).notNull(),
  aiCostCents: integer('ai_cost_cents').default(0).notNull(),

  // Billing
  paymentStatus: text('payment_status', {
    enum: ['not_required', 'pending', 'completed', 'failed']
  }).default('not_required').notNull(),
  amountChargedCents: integer('amount_charged_cents').default(0),

  // Lifecycle
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
}, (table) => ({
  appIdx: index('app_sessions_app_id_idx').on(table.appId),
  userIdx: index('app_sessions_user_id_idx').on(table.userId),
  startedIdx: index('app_sessions_started_at_idx').on(table.startedAt),
}));
```

```typescript
// src/db/schema/creator_posts.ts

import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { apps } from './apps';

export const creatorPosts = pgTable('creator_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  appId: uuid('app_id').references(() => apps.id, { onDelete: 'set null' }),  // optional: link post to specific app

  // Content
  type: text('type', {
    enum: ['update', 'announcement', 'changelog', 'poll', 'showcase']
  }).default('update').notNull(),
  title: text('title'),
  body: text('body').notNull(),                        // markdown
  mediaUrls: jsonb('media_urls').$type<string[]>().default([]),

  // Engagement (denormalized)
  likeCount: integer('like_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),

  // Status
  pinned: integer('pinned').default(0).notNull(),      // 0 = not pinned, 1+ = pin order
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 7.3 Migration Strategy

The migration must preserve all V1 user data, payment history, and credit balances. There are no shortcuts here — Sotally already has paying users.

**Step 1: Pre-migration preparation**

Generate Drizzle migration files using `drizzle-kit generate`. The migration runs as a single transaction:

```typescript
// drizzle/migrations/0005_v2_schema_upgrade.ts

import { sql } from 'drizzle-orm';

export async function up(db) {
  await db.execute(sql`
    -- 1. Merge creators table into users
    ALTER TABLE users
      ADD COLUMN storefront_slug TEXT UNIQUE,
      ADD COLUMN bio TEXT,
      ADD COLUMN banner_url TEXT,
      ADD COLUMN website_url TEXT,
      ADD COLUMN social_links TEXT,
      ADD COLUMN earnings_balance_cents INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN lifetime_earnings_cents INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN stripe_connect_id TEXT,
      ADD COLUMN payout_threshold_cents INTEGER DEFAULT 1000 NOT NULL,
      ADD COLUMN plan_tier TEXT DEFAULT 'free' NOT NULL,
      ADD COLUMN plan_expires_at TIMESTAMPTZ,
      ADD COLUMN stripe_subscription_id TEXT,
      ADD COLUMN onboarding_complete BOOLEAN DEFAULT false NOT NULL;

    -- Copy data from creators table into users
    UPDATE users u SET
      storefront_slug = c.slug,
      bio = c.bio,
      earnings_balance_cents = c.earnings_balance,
      lifetime_earnings_cents = c.lifetime_earnings,
      stripe_connect_id = c.stripe_connect_id
    FROM creators c WHERE c.user_id = u.id;

    -- 2. Remove the role column (everyone can create now)
    ALTER TABLE users DROP COLUMN IF EXISTS role;

    -- 3. Rename tools → apps with structural changes
    ALTER TABLE tools RENAME TO apps;
    ALTER TABLE apps RENAME COLUMN tool_type TO category;
    ALTER TABLE apps
      ADD COLUMN slug TEXT,
      ADD COLUMN original_prompt TEXT DEFAULT '' NOT NULL,
      ADD COLUMN current_version_id UUID,
      ADD COLUMN generation_count INTEGER DEFAULT 1 NOT NULL,
      ADD COLUMN pricing_model TEXT DEFAULT 'free' NOT NULL,
      ADD COLUMN price_amount_cents INTEGER,
      ADD COLUMN sub_monthly_cents INTEGER,
      ADD COLUMN credits_per_use INTEGER,
      ADD COLUMN requires_auth BOOLEAN DEFAULT false NOT NULL,
      ADD COLUMN has_ai_features BOOLEAN DEFAULT false NOT NULL,
      ADD COLUMN ai_model_preference TEXT,
      ADD COLUMN max_ai_calls_per_session INTEGER DEFAULT 20,
      ADD COLUMN total_sessions INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN total_revenue_cents INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN avg_rating NUMERIC(3,2),
      ADD COLUMN review_count INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN follower_count INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN status TEXT DEFAULT 'published' NOT NULL,
      ADD COLUMN published_at TIMESTAMPTZ,
      ADD COLUMN long_description TEXT,
      ADD COLUMN icon_url TEXT,
      ADD COLUMN screenshot_urls JSONB DEFAULT '[]',
      ADD COLUMN tags JSONB DEFAULT '[]';

    -- Generate slugs from existing names
    UPDATE apps SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Back-fill pricing from V1 credits_per_use
    UPDATE apps SET
      pricing_model = 'credits_per_use',
      credits_per_use = credit_cost
    WHERE credit_cost > 0;
    UPDATE apps SET published_at = created_at WHERE status = 'published';

    -- 4. Rename executions → app_sessions
    ALTER TABLE executions RENAME TO app_sessions;
    ALTER TABLE app_sessions RENAME COLUMN tool_id TO app_id;
    ALTER TABLE app_sessions
      ADD COLUMN version_id UUID,
      ADD COLUMN ip_hash TEXT,
      ADD COLUMN user_agent TEXT,
      ADD COLUMN referrer TEXT,
      ADD COLUMN ai_call_count INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN ai_tokens_used INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN ai_cost_cents INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN payment_status TEXT DEFAULT 'not_required' NOT NULL,
      ADD COLUMN amount_charged_cents INTEGER DEFAULT 0,
      ADD COLUMN last_active_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN ended_at TIMESTAMPTZ,
      ADD COLUMN duration_seconds INTEGER;
    ALTER TABLE app_sessions RENAME COLUMN created_at TO started_at;

    -- 5. Create new tables
    CREATE TABLE app_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      label TEXT,
      bundle_url TEXT NOT NULL,
      bundle_hash TEXT NOT NULL,
      bundle_size_bytes INTEGER NOT NULL,
      source_snapshot JSONB,
      generation_id UUID,
      prompt TEXT,
      changelog TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE app_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
      user_id UUID,
      namespace TEXT NOT NULL DEFAULT 'default',
      key TEXT NOT NULL,
      value JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      UNIQUE(app_id, user_id, namespace, key)
    );
    CREATE INDEX app_data_lookup_idx ON app_data(app_id, user_id, namespace, key);

    CREATE TABLE app_generations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      app_id UUID REFERENCES apps(id) ON DELETE SET NULL,
      creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      prompt TEXT NOT NULL,
      system_context JSONB,
      model TEXT NOT NULL,
      input_tokens INTEGER,
      output_tokens INTEGER,
      total_tokens INTEGER,
      llm_cost_cents INTEGER,
      credits_charged INTEGER NOT NULL,
      status TEXT DEFAULT 'queued' NOT NULL,
      result_version_id UUID,
      error_message TEXT,
      error_code TEXT,
      queued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      duration_ms INTEGER
    );

    CREATE TABLE creator_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      app_id UUID REFERENCES apps(id) ON DELETE SET NULL,
      type TEXT DEFAULT 'update' NOT NULL,
      title TEXT,
      body TEXT NOT NULL,
      media_urls JSONB DEFAULT '[]',
      like_count INTEGER DEFAULT 0 NOT NULL,
      comment_count INTEGER DEFAULT 0 NOT NULL,
      pinned INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- 6. Retarget existing review foreign keys
    ALTER TABLE reviews RENAME COLUMN tool_id TO app_id;

    -- 7. Create indexes for new tables
    CREATE INDEX apps_creator_id_idx ON apps(creator_id);
    CREATE INDEX apps_status_idx ON apps(status);
    CREATE INDEX apps_category_idx ON apps(category);
    CREATE INDEX app_sessions_app_id_idx ON app_sessions(app_id);
    CREATE INDEX app_sessions_user_id_idx ON app_sessions(user_id);
    CREATE INDEX app_sessions_started_at_idx ON app_sessions(started_at);

    -- 8. Drop old tables (only after data is migrated)
    DROP TABLE IF EXISTS creators;
  `);
}
```

**Step 2: Deployment procedure**

1. Take a full pg_dump backup before running anything.
2. Put the site in maintenance mode (swap Next.js to a static "Upgrading to V2" page).
3. Run `drizzle-kit migrate` against production.
4. Verify row counts: `SELECT count(*) FROM apps` should equal old `SELECT count(*) FROM tools`.
5. Verify user earnings: `SELECT SUM(earnings_balance_cents) FROM users` should match old `SELECT SUM(earnings_balance) FROM creators`.
6. Deploy V2 application code.
7. Remove maintenance mode.

**Step 3: Rollback plan**

If migration fails mid-transaction, Postgres rolls back automatically (the entire migration is wrapped in `BEGIN`/`COMMIT`). If the application has bugs post-migration, restore from the pg_dump backup and redeploy V1 code. The maintenance window should be under 10 minutes for the current data size (sub-10K rows).

---

## 8. Monetization & Business Model

### 8.1 Revenue Streams: V1 vs V2

**V1 flow (simple, one-dimensional):**
```
User buys credits ($10-$100) → Spends credits on tool runs → Creator earns 70% per run
```

One revenue stream. Platform only makes money when tools are used. No recurring revenue. No incentive alignment between creator success and platform success.

**V2 flow (multi-stream, aligned incentives):**

```
┌──────────────────────────────────────────────────────────────────────┐
│                        REVENUE STREAMS                               │
├──────────────┬───────────────────┬──────────────────────────────────┤
│   STREAM     │   WHO PAYS        │   WHEN                           │
├──────────────┼───────────────────┼──────────────────────────────────┤
│ 1. App       │ Creator           │ Every generation/iteration       │
│    Generation│                   │ request (LLM cost + margin)      │
│    Credits   │                   │                                  │
├──────────────┼───────────────────┼──────────────────────────────────┤
│ 2. End-User  │ End-user of app   │ One-time purchase, subscription, │
│    App Access│                   │ or per-use credits (creator sets)│
├──────────────┼───────────────────┼──────────────────────────────────┤
│ 3. Platform  │ Creator           │ Monthly — unlocks higher limits, │
│    Sub (Pro) │                   │ custom domains, analytics        │
├──────────────┼───────────────────┼──────────────────────────────────┤
│ 4. Txn Fee   │ Deducted from     │ Every paid app transaction       │
│    (15%)     │ creator revenue   │                                  │
├──────────────┼───────────────────┼──────────────────────────────────┤
│ 5. AI Usage  │ Creator (metered) │ When their apps call LLM APIs    │
│    Fees      │                   │ at runtime                       │
└──────────────┴───────────────────┴──────────────────────────────────┘
```

**Stream 1 — App Generation Credits.** Creators spend credits to generate and iterate on apps. This is the supply-side cost of the platform. The credit cost covers the underlying LLM API expense plus a margin. A typical initial generation costs 5-15 credits (depending on complexity); iterations cost 2-5 credits. This stream generates revenue even from creators who never monetize their apps.

**Stream 2 — End-User App Access.** Creators set their own pricing. The platform facilitates the transaction via Stripe. Models available:
- Free (creator pays nothing, end-users access freely — good for audience building)
- One-time purchase ($1-$500 range, paid via Stripe Checkout)
- Monthly subscription ($1-$50/month, managed via Stripe Billing)
- Credits-per-use (end-user spends Sotally credits, same system as V1)

**Stream 3 — Platform Subscriptions (Sotally Pro / Business).** Recurring SaaS revenue from creators who want premium features. This is the most predictable revenue stream.

**Stream 4 — Transaction Fee.** Platform takes 15% of every paid transaction between end-users and creators. This aligns platform incentives with creator success: the platform makes more money when creators make more money.

**Stream 5 — AI Usage Fees (Metered).** When a published app includes AI features (chat, analysis, generation), runtime LLM calls are metered and billed to the creator. The creator can pass this cost to end-users via their pricing model, or absorb it. Billing is monthly, based on actual token consumption. Markup over raw LLM cost: 40-60% (covers infrastructure, rate limiting, abuse prevention).

### 8.2 Pricing Strategy

**Creator Tiers:**

| Feature | Free | Pro ($19/mo) | Business ($49/mo) |
|---|---|---|---|
| Published apps | 3 | Unlimited | Unlimited |
| Storefront | Basic (slug.sotally.com) | Custom domain | Custom domain + white-label |
| App generation credits included | 50/mo | 200/mo | 500/mo |
| Additional credits | $1 per 10 | $1 per 10 | $0.80 per 10 |
| End-users per month | 100 | 10,000 | Unlimited |
| AI runtime calls per app/day | 100 | 1,000 | 10,000 |
| Analytics | Basic (sessions, revenue) | Advanced (funnels, retention, cohorts) | Advanced + API export |
| Support | Community | Email (48h) | Priority (24h) |
| Transaction fee | 20% | 15% | 12% |
| Team members | 1 | 1 | 5 |
| API access | No | No | Yes |

**Credit Pricing (for app generation):**

| Package | Credits | Price | Per-Credit |
|---|---|---|---|
| Starter | 50 | $5 | $0.10 |
| Builder | 200 | $15 | $0.075 |
| Power | 500 | $30 | $0.06 |
| Included w/ Pro | 200/mo | $0 (bundled) | — |
| Included w/ Business | 500/mo | $0 (bundled) | — |

**End-User Pricing** is set by creators with platform minimums:
- One-time purchase: minimum $0.99, maximum $499.99
- Subscription: minimum $0.99/mo, maximum $99.99/mo
- Credits-per-use: minimum 1 credit

### 8.3 Creator Revenue Split

V2 is more generous than V1 to attract creators to a new platform:

| Component | V1 | V2 |
|---|---|---|
| Creator share | 70% | 85% |
| Platform share | 30% | 15% |
| Stripe processing | Included in 30% | Deducted separately (~2.9% + $0.30) |

**Worked example — creator sells an app for $10/month, gets 50 subscribers:**

```
Gross revenue:                     $500.00/mo
Stripe processing (2.9% + $0.30): -$29.50
Net after Stripe:                  $470.50
Platform fee (15%):                -$70.58
Creator payout:                    $399.92/mo (79.98% effective rate)
```

**Payout mechanics:**
- Minimum payout threshold: $10 (reduced from V1's implicit higher threshold)
- Payout frequency: Weekly (automatic via Stripe Connect)
- Payout method: Stripe Connect Express (bank transfer)
- Dashboard visibility: Real-time earnings, pending payouts, transaction history

### 8.4 Unit Economics

**Cost to Acquire a Creator (CAC):**

| Channel | Estimated CAC |
|---|---|
| Organic (SEO, Product Hunt, Twitter) | $0-5 |
| Content marketing (tutorials, showcases) | $8-15 |
| Paid ads (Phase 2+) | $20-40 |
| Blended estimate (Phase 1) | $5-10 |

Phase 1 focuses entirely on organic acquisition. The product itself is the growth engine — every published app is a landing page for Sotally.

**Cost to Generate an App (COGS per generation):**

Assuming Claude Sonnet for generation (current pricing: $3/M input, $15/M output):

| Generation Type | Input Tokens | Output Tokens | Raw LLM Cost | Credits Charged | Margin |
|---|---|---|---|---|---|
| Initial (from prompt) | ~4K | ~12K | $0.19 | 10 ($1.00) | 81% |
| Iteration (modify) | ~8K (includes source) | ~8K | $0.14 | 5 ($0.50) | 72% |
| Bug fix | ~10K | ~4K | $0.09 | 3 ($0.30) | 70% |
| Major feature add | ~10K | ~16K | $0.27 | 15 ($1.50) | 82% |

Average cost per generation event: ~$0.17. Average revenue per generation event: ~$0.70. Gross margin on generation: ~76%.

**Revenue Per Creator Per Month (ARPC):**

Segmented by engagement level:

| Segment | % of Creators | Monthly Revenue | Weighted |
|---|---|---|---|
| Free, inactive (signed up, no app) | 40% | $0 | $0 |
| Free, casual (1-2 apps, buys credits occasionally) | 30% | $3 | $0.90 |
| Free, active (3 apps, regular iterations) | 15% | $8 | $1.20 |
| Pro subscriber | 12% | $19 + $5 credits | $2.88 |
| Business subscriber | 3% | $49 + $10 credits | $1.77 |
| **Blended ARPC** | | | **$6.75** |

Additionally, platform transaction fees on end-user app revenue add an estimated $1-3/creator/month once the marketplace has traction (Phase 2+).

**Breakeven Analysis:**

Fixed monthly costs (Phase 1 — single Hetzner VPS):

| Item | Monthly Cost |
|---|---|
| Hetzner VPS (CPX41) | $28 |
| Cloudflare Pro | $20 |
| Domain + DNS | $2 |
| PostHog (free tier) | $0 |
| Stripe fees | Variable |
| Email (transactional, Resend) | $0 (free tier) |
| Backups (Hetzner snapshot) | $4 |
| **Total fixed** | **~$54/mo** |

Variable costs: LLM API spend scales with generation volume. At 76% gross margin on generations, this is well-covered.

**Breakeven: $54 / $6.75 ARPC = 8 creators.** Extremely low breakeven due to minimal infrastructure costs. At 100 creators, estimated monthly revenue is $675 against ~$80 in costs (fixed + variable LLM spend). At 1,000 creators, estimated revenue is $6,750/mo.

The real question is not breakeven but **growth rate.** The V2 model is designed so that every successful creator becomes a distribution channel — their end-users see "Built on Sotally" and become potential creators themselves.

---

## 9. Infrastructure & Deployment

### 9.1 Deployment Architecture (Updated for V2)

V2 adds three new infrastructure components to the V1 Docker Compose stack: an app generation worker, object storage for app bundles, and a CDN layer for serving published apps.

**Updated Docker Compose services:**

```yaml
# docker-compose.yml (Phase 1 — single VPS)
services:
  # === Core Application ===
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://sotally:${DB_PASSWORD}@db:5432/sotally
      - REDIS_URL=redis://redis:6379
      - R2_ENDPOINT=${R2_ENDPOINT}
      - R2_ACCESS_KEY=${R2_ACCESS_KEY}
      - R2_SECRET_KEY=${R2_SECRET_KEY}
      - R2_BUCKET=sotally-apps
    depends_on:
      - db
      - redis
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  # === App Generation Worker ===
  # Processes generation queue (CPU/memory intensive due to build steps)
  generation-worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - DATABASE_URL=postgresql://sotally:${DB_PASSWORD}@db:5432/sotally
      - REDIS_URL=redis://redis:6379
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - R2_ENDPOINT=${R2_ENDPOINT}
      - R2_ACCESS_KEY=${R2_ACCESS_KEY}
      - R2_SECRET_KEY=${R2_SECRET_KEY}
      - R2_BUCKET=sotally-apps
      - CONCURRENCY=2
    depends_on:
      - db
      - redis
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  # === Database ===
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=sotally
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=sotally
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  # === Cache & Queue ===
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redisdata:/data
    restart: unless-stopped

  # === Reverse Proxy ===
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  caddy_data:
  caddy_config:
```

**Caddyfile (wildcard subdomain routing):**

```caddyfile
# Main site
sotally.com, www.sotally.com {
    reverse_proxy web:3000
}

# Wildcard: creator storefronts
*.sotally.com {
    reverse_proxy web:3000
}
```

The Next.js app handles subdomain routing in middleware — extracting the storefront slug from the `Host` header and routing to the appropriate creator page or app view.

**Generation Worker architecture:**

The worker is a standalone Node.js process (separate from the web server) that:

1. Polls Redis queue `sotally:generation:queue` via BullMQ
2. Picks up generation jobs (one at a time per worker, configurable concurrency)
3. Calls the LLM API with the user's prompt + system context
4. Receives generated code
5. Runs an isolated build step (esbuild/Vite) inside a sandboxed temp directory
6. Uploads the compiled bundle to Cloudflare R2
7. Creates an `app_versions` row and updates the `apps` table
8. Pushes status updates via Redis pub/sub (the web server relays these to the client over WebSocket)

Build isolation is critical. Each generation runs in its own temp directory with a clean `node_modules` install. In Phase 1, this is process-level isolation. Phase 2 adds container-level isolation (each build in a throwaway Docker container).

### 9.2 Scaling Plan

**Phase 1: 0-1,000 creators (Single VPS)**

- **Server:** Hetzner CPX41 (8 vCPU AMD, 16 GB RAM, 240 GB NVMe) — $28.80/mo
- **Architecture:** Everything on one machine. Docker Compose. Postgres, Redis, web, worker, Caddy all collocated.
- **App serving:** Bundles stored on Cloudflare R2 (free egress), served via Cloudflare CDN. The VPS never serves static app files directly.
- **DB backups:** Hetzner automated snapshots (daily) + pg_dump to R2 (hourly via cron).
- **Bottleneck:** Generation worker CPU/memory. At 2 concurrent generations, each taking 15-30 seconds, throughput is ~240-480 generations/hour. More than enough for 1K creators.
- **Failover:** None. Single point of failure. Acceptable for this stage. Mean time to recovery: redeploy from Git + restore DB snapshot (~15 minutes).

**Phase 2: 1,000-10,000 creators (Separated services)**

- **Database:** Migrate to Hetzner managed Postgres or a dedicated DB VPS. Connection pooling via PgBouncer.
- **Web tier:** 2-3 web server instances behind Caddy load balancer (or move to Hetzner Load Balancer).
- **Worker tier:** 2-4 dedicated worker VPSes. Each runs 2-4 concurrent generation jobs. Total throughput: 1,000-2,000 generations/hour.
- **Redis:** Dedicated VPS or Hetzner managed Redis equivalent. Separate instances for cache vs. queue if needed.
- **App serving:** Cloudflare R2 + Workers for app runtime. Edge-cached. Zero load on origin for published apps.
- **Estimated cost:** $150-400/mo (primarily DB and worker nodes).

**Phase 3: 10,000+ creators (Kubernetes)**

- **Orchestration:** Migrate to Kubernetes (Hetzner k3s cluster or managed K8s).
- **Web tier:** Horizontal pod autoscaling based on request rate. 5-20 pods depending on load.
- **Worker tier:** Autoscaling worker pool. Scale to zero during off-peak. Each generation runs in an ephemeral pod with resource limits.
- **Database:** Managed Postgres with read replicas. Write primary + 2 read replicas. Connection pooling via PgBouncer sidecar.
- **App serving:** Cloudflare Workers for app runtime (edge-deployed, sub-50ms latency globally). App bundles served entirely from edge, no origin hit.
- **Build isolation:** Each generation runs in an ephemeral Kubernetes Job with a sandboxed container (no network access during build, resource limits, timeout enforcement).
- **Estimated cost:** $500-2,000/mo depending on generation volume and traffic.

### 9.3 CDN & Edge Strategy

**App Bundle Distribution:**

Published apps are static bundles (HTML + JS + CSS). They are a perfect CDN use case.

```
Creator publishes app
        │
        ▼
  Generation Worker builds bundle
        │
        ▼
  Upload to Cloudflare R2
  Key: apps/{appId}/v{version}/bundle.tar.gz
  Also: apps/{appId}/v{version}/index.html
        apps/{appId}/v{version}/assets/*
        │
        ▼
  Cloudflare CDN auto-caches
  (R2 is natively integrated with Cloudflare CDN)
        │
        ▼
  End-user requests slug.sotally.com/app-name
        │
        ▼
  Cloudflare Worker routes request:
    1. Check if app exists (KV lookup, <1ms)
    2. Serve index.html from R2 (edge-cached)
    3. All /assets/* served directly from R2
    4. API calls (/api/*) proxied to origin
```

**Storefront Pages (ISR via Next.js):**

Creator storefront pages (`dansmith.sotally.com`) use Incremental Static Regeneration:

- First visit: Server-renders the page, caches it.
- Subsequent visits: Served from cache. Revalidated every 60 seconds in the background.
- Cache invalidation: When creator updates profile or publishes an app, manually revalidate via `res.revalidate()`.

This means storefront pages are effectively static for most visitors, with near-zero server load.

**API Routing:**

API calls from within published apps hit the origin server. In Phase 1, this is the single VPS. For Phase 2+, the API is deployed to 2-3 regions if latency becomes an issue (EU, US-East, US-West). In practice, most Sotally creators and users will initially be concentrated in 1-2 regions, so multi-region is a Phase 3 concern.

**Custom Domains (Pro feature):**

Pro creators can map a custom domain to their storefront. Implementation:

1. Creator enters their domain in settings.
2. Platform provides a CNAME record pointing to `custom.sotally.com`.
3. Caddy (Phase 1) or Cloudflare for SaaS (Phase 2+) handles TLS certificate issuance automatically.
4. Middleware checks the `Host` header against the `custom_domains` table and routes accordingly.

### 9.4 Cost Estimates

**Phase 1 (0-1K creators): ~$60-80/mo**

| Service | Provider | Monthly Cost |
|---|---|---|
| VPS (CPX41, 8 vCPU / 16 GB) | Hetzner | $28.80 |
| R2 object storage (10 GB) | Cloudflare | $0 (free tier: 10 GB storage, 10M reads) |
| Cloudflare Pro (wildcard SSL, caching) | Cloudflare | $20 |
| Domain registration (sotally.com) | Cloudflare | ~$1.50/mo amortized |
| Automated backups (snapshots) | Hetzner | $5.76 (20% of VPS) |
| Transactional email (Resend) | Resend | $0 (free tier: 3K emails/mo) |
| PostHog analytics | PostHog | $0 (free tier: 1M events/mo) |
| LLM API (500 generations/mo) | Anthropic/OpenAI | $85 (at ~$0.17/generation avg) |
| **Total** | | **~$141/mo** |

Note: LLM cost is variable and directly correlated with generation volume. At low volumes (100 generations/mo), LLM cost drops to ~$17, bringing total to ~$73/mo.

**Phase 2 (1K-10K creators): ~$400-800/mo**

| Service | Monthly Cost |
|---|---|
| Web VPS x2 (CX32) | $46 |
| Worker VPS x2 (CPX31) | $52 |
| DB VPS (dedicated, CX41) | $34 |
| Redis VPS (CX11) | $5 |
| R2 storage (100 GB) + egress | $5 |
| Cloudflare Pro | $20 |
| Hetzner Load Balancer | $7 |
| Backups | $15 |
| Transactional email (Resend Pro) | $20 |
| PostHog | $0-50 |
| LLM API (5K generations/mo) | $850 |
| **Total** | **~$1,054/mo** |

**Phase 3 (10K+ creators): ~$2,000-5,000/mo**

| Service | Monthly Cost |
|---|---|
| K8s cluster (6-12 nodes) | $300-800 |
| Managed Postgres (primary + replicas) | $100-300 |
| Managed Redis | $30-80 |
| R2 storage (1 TB) | $15 |
| Cloudflare Business | $200 |
| LLM API (50K generations/mo) | $8,500 |
| Monitoring (Grafana Cloud) | $50 |
| Backups + DR | $50-100 |
| **Total** | **~$9,245-10,045/mo** |

At Phase 3 volume (10K creators), estimated revenue is $67,500/mo (10K x $6.75 ARPC). Infrastructure cost represents ~15% of revenue. LLM API is by far the dominant cost. Negotiating volume pricing with Anthropic/OpenAI or shifting to self-hosted models becomes a priority at this stage.

### 9.5 Monitoring & Observability

**Tier 1 — Infrastructure health (always-on):**

| What | How | Alert Threshold |
|---|---|---|
| VPS CPU, RAM, disk | Hetzner built-in metrics + node_exporter | CPU > 80% sustained 5min, disk > 85% |
| Postgres connections, query latency | pg_stat_statements + custom queries | Active connections > 80% of max, p95 query > 500ms |
| Redis memory, queue depth | Redis INFO + BullMQ dashboard | Memory > 80%, queue depth > 100 jobs |
| Container health | Docker healthchecks | Any container unhealthy for > 30s |
| SSL certificate expiry | Caddy auto-renew (check logs) | Expiry < 7 days |

**Tier 2 — Application metrics (PostHog + custom):**

| Metric | Collection | Dashboard |
|---|---|---|
| App generation success rate | `app_generations` table, aggregated | Target: > 92% success rate |
| Generation p50/p95 latency | `duration_ms` from `app_generations` | Target: p50 < 20s, p95 < 45s |
| App runtime errors | Client-side error boundary reports to `/api/app-errors` | Grouped by app, shown to creator |
| API response times | Next.js middleware timing | p50 < 100ms, p95 < 500ms |
| WebSocket connection stability | Custom heartbeat monitoring | Reconnection rate < 5% |

**Tier 3 — Business metrics (PostHog funnels):**

| Funnel | Stages | Target Conversion |
|---|---|---|
| Creator activation | Signup -> First prompt -> App generated -> App published | 60% -> 80% -> 70% = 34% overall |
| Creator monetization | Published app -> Sets price -> First sale | 30% -> 50% = 15% of publishers |
| End-user engagement | Visit storefront -> Open app -> Complete session -> Return within 7 days | 40% -> 60% -> 25% |
| Revenue growth | MRR, ARPC, churn rate, LTV | Tracked monthly, reviewed weekly |

**Implementation stack:**

- **PostHog** (self-hosted on the same VPS in Phase 1, cloud in Phase 2+): Product analytics, funnels, session recordings (for debugging app generation UX), feature flags.
- **Structured logging**: All services log JSON to stdout. Docker captures logs. In Phase 1, use `docker compose logs` with grep. In Phase 2+, ship to Grafana Loki.
- **Uptime monitoring**: External ping via UptimeRobot (free tier: 50 monitors, 5-minute intervals). Monitors: `sotally.com`, `api.sotally.com/health`, a sample storefront, and the generation worker health endpoint.
- **Alerting**: Phase 1 alerts go to a Discord webhook (zero cost, instant setup). Phase 2 adds PagerDuty for on-call rotation.

**Generation-specific observability:**

Every generation request produces a structured log entry:

```json
{
  "event": "generation_complete",
  "generation_id": "uuid",
  "type": "initial",
  "model": "claude-sonnet-4-20250514",
  "input_tokens": 4200,
  "output_tokens": 11800,
  "cost_cents": 19,
  "duration_ms": 18400,
  "status": "succeeded",
  "build_duration_ms": 3200,
  "bundle_size_bytes": 84200
}
```

This feeds into a dashboard showing: generation volume over time, cost per generation trending, failure reasons (pie chart: syntax error, build failure, timeout, LLM refusal), and model performance comparison (if A/B testing different LLMs).

**Error budget approach:**

The platform targets 99.5% uptime for the web application and 95% success rate for app generations (LLMs are inherently non-deterministic; some prompts will produce unbuildable code). When error rates exceed these thresholds, new feature work pauses until reliability is restored. This is enforced socially, not automated, given the small team size in Phase 1.

# 10. Implementation Roadmap

This roadmap assumes a team of 3-4 engineers, one designer, and one product lead. All estimates include testing, code review, and staging validation. Weeks are calendar weeks; overlap between phases is intentional where dependencies allow.

---

## 10.1 Phase 0: Foundation (Weeks 1-2)

**Goal:** Strip V1 marketplace surfaces, preserve infrastructure, and scaffold the new creation-first architecture.

### What to Strip from V1

| Remove | Rationale |
|--------|-----------|
| Tool listings page (`/tools`, `/tools/[slug]`) | Replaced by creator storefronts and app detail pages |
| Tool builder UI (the form-based tool creation flow) | Replaced by AI generation engine |
| Tool detail pages and embedded iframe renderer | Replaced by sandboxed app runtime |
| Marketplace search and category browsing | Replaced by niche-based discovery in Phase 4 |
| Social proof widgets tied to tool metrics | Will be rebuilt around creator/app metrics |
| Changelog public page | Low priority; re-add later if needed |
| Watermark system | Not applicable to creator-owned apps |

Do NOT delete the code. Move stripped components to a `packages/web/src/_v1_archive/` directory. This costs nothing and allows recovery if assumptions prove wrong.

### What to Keep

| Keep | Why |
|------|-----|
| Authentication system (Supabase Auth, OAuth providers) | Stable, works, no reason to rebuild |
| User table schema and API routes | Extended with creator/end-user role flags |
| Payment infrastructure (Stripe integration) | Foundation for creator payouts and platform billing |
| Database (Supabase Postgres) and migration tooling | Add new tables, keep existing migration history |
| Deployment pipeline (Vercel) | Extend with subdomain routing |
| Monorepo structure (`packages/*`) | Add `packages/engine` for AI generation |
| Global nav component shell | Redesign content, keep the layout scaffolding |
| Referral system tables | Re-purpose for creator referrals in Phase 4 |

### New Infrastructure to Add

**1. `packages/engine` — AI Generation Worker**

```
packages/engine/
├── src/
│   ├── pipeline.ts          # Orchestrates prompt → code → build → deploy
│   ├── prompt-builder.ts    # Constructs LLM prompts from user description
│   ├── code-generator.ts    # Calls Claude API, handles streaming
│   ├── validator.ts         # Static analysis, security scan, build check
│   ├── builder.ts           # Bundles generated React app
│   └── deployer.ts          # Pushes built app to storage + CDN
├── templates/               # Base app templates per niche
│   ├── base-react/          # Minimal React + Tailwind scaffold
│   └── niche-starters/      # Pre-configured starting points
├── tests/
└── package.json
```

Week 1 deliverable: The pipeline runs end-to-end with a hardcoded prompt, producing a built React bundle in object storage. It does not need to be production-quality yet.

**2. App Storage Layer**

- Supabase Storage bucket `app-builds` for compiled app bundles
- Each app stored at `{creator_id}/{app_id}/{version}/` path
- Metadata in Postgres: `apps` table with `id`, `creator_id`, `slug`, `current_version`, `status`, `niche`, `created_at`, `published_at`
- Source code (generated) stored in `app-source` bucket for re-generation and iteration

**3. Subdomain Routing**

- Vercel wildcard domain: `*.sotally.com`
- Middleware in `packages/web` intercepts requests:
  - If hostname is `sotally.com` or `www.sotally.com` → serve platform UI
  - If hostname matches `{name}.sotally.com` → serve storefront renderer with creator context
- DNS: Single wildcard CNAME record pointing to Vercel

Implementation in Next.js middleware (`packages/web/src/middleware.ts`):

```typescript
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = extractSubdomain(hostname); // returns null for apex

  if (subdomain && subdomain !== 'www') {
    // Rewrite to storefront route with creator context
    return NextResponse.rewrite(
      new URL(`/_storefronts/${subdomain}${request.nextUrl.pathname}`, request.url)
    );
  }

  return NextResponse.next();
}
```

**4. Database Migrations**

New tables for Phase 0:

```sql
-- Creator profiles (extends existing user table)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'; -- 'creator', 'user', 'admin'
ALTER TABLE users ADD COLUMN subdomain TEXT UNIQUE;
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN niche TEXT; -- primary niche

-- Apps table
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,            -- original user prompt
  source_version INT DEFAULT 1,
  status TEXT DEFAULT 'draft',     -- draft, published, archived, flagged
  niche TEXT,
  storage_path TEXT,               -- path in app-builds bucket
  metadata JSONB DEFAULT '{}',     -- screenshots, tags, pricing, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE(creator_id, slug)
);

-- Generation jobs (tracks AI generation pipeline)
CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'queued',    -- queued, generating, building, deploying, complete, failed
  error TEXT,
  duration_ms INT,
  llm_model TEXT,
  llm_tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_apps_creator ON apps(creator_id);
CREATE INDEX idx_apps_niche ON apps(niche);
CREATE INDEX idx_apps_status ON apps(status);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
```

### Week 1-2 Day-by-Day

| Day | Task | Owner |
|-----|------|-------|
| D1-2 | Strip V1 marketplace UI, archive components, verify auth still works | Frontend |
| D1-2 | Create `packages/engine` skeleton, set up Claude API integration | Backend |
| D3-4 | Database migrations, app storage buckets, environment variables | Backend |
| D3-4 | Subdomain routing middleware, verify `*.sotally.com` DNS | Frontend |
| D5-6 | End-to-end smoke test: hardcoded prompt → generated app → stored in bucket → served at subdomain | Full team |
| D7-8 | Empty storefront page renders at `name.sotally.com`, shows creator profile placeholder | Frontend |
| D9-10 | Bug fixes, edge cases (invalid subdomains, auth redirect with subdomains), documentation | Full team |

### Phase 0 Exit Criteria

- [ ] V1 tool pages return 404 or redirect to homepage
- [ ] Authentication works (signup, login, OAuth)
- [ ] Payments infrastructure is intact (Stripe keys, webhook endpoint)
- [ ] `packages/engine` can generate a React app from a hardcoded prompt and store the bundle
- [ ] `creator.sotally.com` resolves and renders an empty storefront page
- [ ] All existing tests pass (or are updated/removed for stripped features)
- [ ] CI pipeline is green on the `v2-foundation` branch

---

## 10.2 Phase 1: Core Creation Loop (Weeks 3-6)

**Goal:** A creator signs up, describes an app in natural language, previews it, iterates, and publishes it to their storefront. This is the MVP that proves the core value proposition.

### Week 3-4: AI Generation Engine

**Prompt-to-App Pipeline (detailed)**

```
User prompt (natural language)
  → Prompt Builder (adds system context, niche hints, UI framework constraints)
    → Claude API (claude-sonnet-4-20250514, streaming)
      → Raw generated code (React + Tailwind)
        → Validator (static analysis, security checks, dependency allowlist)
          → Builder (esbuild bundle, asset optimization)
            → Deployer (upload to Supabase Storage, update app record)
              → Preview URL available
```

**Prompt Builder Design:**

The prompt builder is the most important component. It transforms a vague user description into a structured LLM prompt that reliably produces working React apps.

```typescript
interface PromptContext {
  userPrompt: string;
  niche: string | null;
  creatorName: string;
  iterationHistory: { prompt: string; feedback: string }[]; // for iterations
}

function buildPrompt(ctx: PromptContext): string {
  return `
You are building a single-page React application. Output ONLY valid JSX code.

CONSTRAINTS:
- Use React 18 with hooks (useState, useEffect, useCallback)
- Use Tailwind CSS for ALL styling (no inline styles, no CSS files)
- The app must be a single file: App.tsx
- Available libraries: recharts (charts), date-fns (dates), lodash (utilities)
- No external API calls. All data is local/mock.
- No eval(), no dynamic imports, no external scripts
- Must be mobile-responsive
- Must include proper error boundaries

CREATOR CONTEXT:
- Creator name: ${ctx.creatorName}
- Niche: ${ctx.niche || 'general'}

USER REQUEST:
${ctx.userPrompt}

${ctx.iterationHistory.length > 0 ? `
PREVIOUS VERSIONS AND FEEDBACK:
${ctx.iterationHistory.map((h, i) => `Version ${i + 1}: "${h.prompt}" → Feedback: "${h.feedback}"`).join('\n')}
` : ''}

OUTPUT FORMAT:
Return a single code block with the complete App.tsx file. No explanations, no markdown outside the code block.
`;
}
```

**Validator Checks (run before building):**

1. Parse AST with `@swc/core` — reject if unparseable
2. Scan for banned patterns: `eval(`, `Function(`, `dangerouslySetInnerHTML` with external content, `<script>`, `fetch(` to non-allowed origins
3. Verify all imports are from the allowlist: `react`, `recharts`, `date-fns`, `lodash`
4. Check component exports: must have a default export
5. Estimated bundle size check (reject if > 500KB pre-minification)

**Builder:**

- Use esbuild for bundling (fast, deterministic)
- Inject a base HTML template with Tailwind CDN and React runtime
- Output: `index.html` + `app.js` + any static assets
- Total bundle served from CDN; no server-side rendering needed for generated apps

### Week 4-5: Creator UI

**Creation Flow:**

```
/create → Prompt input (large textarea + niche selector)
  → "Generate" button
    → Loading state with progress (queued → generating → building → deploying)
      → Split-screen preview: code on left (read-only), live app on right
        → Iteration: "Make the chart blue" → re-generates with context
          → "Publish" button → app goes live on storefront
```

Key screens to build:

| Screen | Route | Description |
|--------|-------|-------------|
| Creator Dashboard | `/dashboard` | List of creator's apps (draft + published), usage stats placeholder |
| Create App | `/create` | Prompt input, niche selector, generation trigger |
| App Studio | `/studio/[appId]` | Split-screen editor: preview + iteration chat |
| Storefront Settings | `/settings/storefront` | Subdomain, display name, bio, avatar |

**App Studio — the core interaction:**

The studio is where creators spend most of their time. It must feel responsive even though generation takes 10-30 seconds.

- Left panel: Chat-style iteration history (prompt → result → feedback → result)
- Right panel: Live preview in sandboxed iframe
- Bottom bar: "Publish", "Save Draft", "Start Over"
- Generation uses Server-Sent Events (SSE) for real-time status updates
- Preview refreshes automatically when new build completes

**Preview Sandbox:**

Generated apps render inside an `<iframe>` with strict sandboxing:

```html
<iframe
  src={previewUrl}
  sandbox="allow-scripts allow-same-origin"
  style="width: 100%; height: 100%; border: none;"
  title={appTitle}
/>
```

The `allow-same-origin` is needed for localStorage within the app. The CSP on the served HTML prevents any external network requests.

### Week 5-6: Storefront

**Storefront Layout (`name.sotally.com`):**

```
┌─────────────────────────────────┐
│  [Avatar] Creator Name          │
│  Bio text here                  │
│  [Follow] [Share]               │
├─────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐    │
│  │ App │  │ App │  │ App │    │
│  │  1  │  │  2  │  │  3  │    │
│  └─────┘  └─────┘  └─────┘    │
│  ┌─────┐  ┌─────┐             │
│  │ App │  │ App │             │
│  │  4  │  │  5  │             │
│  └─────┘  └─────┘             │
└─────────────────────────────────┘
```

Each app card shows: auto-generated screenshot (via Puppeteer during build), title, short description, and usage count (placeholder for Phase 2).

**Storefront Data Flow:**

```
Request to creator.sotally.com
  → Middleware rewrites to /_storefronts/[subdomain]
    → getServerSideProps fetches creator profile + published apps
      → Renders storefront with ISR (revalidate every 60 seconds)
```

### Phase 1 Exit Criteria

- [ ] Creator can sign up, claim a subdomain, and set up their profile
- [ ] Creator can type a natural language prompt and get a working React app generated
- [ ] Generation completes in under 60 seconds for typical prompts
- [ ] Creator can iterate on the generated app with follow-up prompts (minimum 5 iterations per session)
- [ ] Creator can publish an app; it appears on their storefront
- [ ] Storefront renders at `name.sotally.com` with creator profile and app grid
- [ ] App preview works in sandboxed iframe with no console errors
- [ ] Generation failure rate is below 20% (4 out of 5 prompts produce a working app)

---

## 10.3 Phase 2: End-User Experience (Weeks 7-10)

**Goal:** End-users can discover, use, and benefit from creator apps. Creators see real usage data.

### Week 7-8: App Runtime

**Sandboxed Execution Environment:**

Production apps need a more hardened runtime than the preview iframe. The architecture:

```
end-user visits creator.sotally.com/app/budget-tracker
  → Storefront middleware serves app shell
    → App shell loads app bundle from CDN (Supabase Storage via CDN)
      → Bundle executes inside sandboxed iframe
        → App can read/write to per-user localStorage (scoped to app)
        → App can call Sotally SDK for persistence (optional, Phase 2.5)
```

**Per-User Data Persistence:**

End-users need their data to persist across sessions. Two tiers:

1. **Anonymous (no account):** `localStorage` scoped to the app's iframe origin. Data lives on the device only. Lost if browser data is cleared.
2. **Authenticated (Sotally account):** Data synced to Supabase via a lightweight SDK injected into the app runtime.

The SDK (injected as a global before the app bundle loads):

```typescript
// Injected into app runtime as window.Sotally
window.Sotally = {
  user: { id, name, email } | null,
  storage: {
    get: (key: string) => Promise<any>,
    set: (key: string, value: any) => Promise<void>,
    delete: (key: string) => Promise<void>,
  },
  analytics: {
    track: (event: string, properties?: Record<string, any>) => void,
  },
};
```

Storage calls route through a postMessage bridge from the sandbox iframe to the parent storefront, which forwards to the Supabase API with proper auth tokens. The app code never sees the auth token.

**App Detail Page (`creator.sotally.com/app/[slug]`):**

```
┌──────────────────────────────────────┐
│  ← Back to storefront                │
│                                      │
│  App Title                           │
│  by Creator Name                     │
│                                      │
│  [Screenshot carousel]               │
│                                      │
│  Description (from AI-generated      │
│  summary of the app's functionality) │
│                                      │
│  [Use App]  [Share]  [Report]        │
│                                      │
│  Stats: 142 users · Created Mar 2026 │
└──────────────────────────────────────┘
```

### Week 8-9: Discovery

**Browse by Niche:**

- Route: `sotally.com/explore/[niche]`
- Shows all published apps in a niche, sorted by recent first (later: by popularity)
- Each niche page has a header with niche description and a "Create an app for [niche]" CTA

**Search:**

- Full-text search across app titles, descriptions, and prompts (using Supabase `tsvector`)
- Route: `sotally.com/search?q=budget+tracker`
- Results ranked by relevance, with niche facets

```sql
-- Add search index to apps table
ALTER TABLE apps ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(prompt, '')), 'C')
  ) STORED;

CREATE INDEX idx_apps_search ON apps USING GIN(search_vector);
```

### Week 9-10: End-User Accounts and Creator Analytics

**End-User Accounts:**

End-users sign up with the same auth system as creators but with role `user`. The signup flow is lighter: email + password or Google OAuth, no subdomain claim, no onboarding wizard.

Why end-user accounts matter: data persistence across devices, favorites, and eventually purchasing paid apps.

**Creator Analytics Dashboard (`/dashboard/analytics`):**

| Metric | Source | Update Frequency |
|--------|--------|-----------------|
| Total app views | Analytics events (Sotally SDK `track('view')`) | Real-time via Supabase Realtime |
| Unique users per app | Distinct user IDs from storage API calls | Hourly aggregation |
| Session duration | Time between first and last SDK event | Hourly aggregation |
| Top apps by usage | Aggregated from above | Daily rollup |
| Geography (country) | IP geolocation at CDN edge (Vercel) | Daily rollup |

Analytics data stored in a separate `analytics_events` table with time-series partitioning:

```sql
CREATE TABLE analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID,                    -- null for anonymous
  event_type TEXT NOT NULL,        -- 'view', 'session_start', 'session_end', 'custom'
  properties JSONB DEFAULT '{}',
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE analytics_events_2026_03 PARTITION OF analytics_events
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
-- (automate partition creation via pg_partman or a cron job)
```

### Phase 2 Exit Criteria

- [ ] End-users can browse apps by niche and search by keyword
- [ ] End-users can use apps with data persistence (localStorage for anonymous, synced for authenticated)
- [ ] App detail pages show screenshots, description, and usage stats
- [ ] Creators see analytics: views, users, session duration per app
- [ ] End-user signup and login works
- [ ] App runtime sandbox prevents cross-app data access
- [ ] Page load time for app runtime is under 3 seconds on 3G

---

## 10.4 Phase 3: Monetization (Weeks 11-14)

**Goal:** Creators can charge for apps. The platform takes a cut. First revenue flows.

### Week 11-12: App Pricing and Stripe Connect

**Pricing Models per App:**

Creators choose one of:
- **Free** — no payment required
- **One-time purchase** — user pays once, gets permanent access
- **Subscription** — monthly recurring (creator sets price, minimum $1/month)

**Stripe Connect Integration:**

```
Creator onboards to Stripe Connect (Express account)
  → Platform creates connected account
    → When end-user pays for an app:
      → Payment goes to platform Stripe account
        → Platform takes 15% fee
          → Remaining 85% transferred to creator's connected account
            → Creator receives payout on Stripe's standard schedule (2-day rolling)
```

Database additions:

```sql
ALTER TABLE apps ADD COLUMN pricing_type TEXT DEFAULT 'free'; -- free, one_time, subscription
ALTER TABLE apps ADD COLUMN price_cents INT;                  -- null for free
ALTER TABLE apps ADD COLUMN currency TEXT DEFAULT 'usd';

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id),
  user_id UUID REFERENCES users(id),
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,      -- null for one-time
  amount_cents INT NOT NULL,
  platform_fee_cents INT NOT NULL,
  creator_payout_cents INT NOT NULL,
  status TEXT DEFAULT 'pending',    -- pending, succeeded, refunded, disputed
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ADD COLUMN stripe_connect_account_id TEXT;
ALTER TABLE users ADD COLUMN stripe_connect_onboarded BOOLEAN DEFAULT false;
```

**Paywall Enforcement:**

When an end-user visits a paid app, the app shell checks purchase status before loading the bundle:

```
Request to paid app
  → App shell checks: does this user have an active purchase?
    → Yes: load app bundle normally
    → No: show pricing card with "Buy for $X" or "Subscribe for $X/mo"
      → Stripe Checkout (hosted)
        → Webhook confirms payment
          → Purchase record created
            → User redirected to app (now unlocked)
```

### Week 12-13: Creator Payouts Dashboard

**Revenue Dashboard (`/dashboard/revenue`):**

- Total earnings (all time, this month, this week)
- Per-app revenue breakdown
- Pending payouts vs. completed payouts
- Stripe Connect account status and link to Stripe Express dashboard
- Transaction history with filters

### Week 13-14: Platform Subscription Tiers

| Feature | Free | Pro ($19/mo) | Business ($49/mo) |
|---------|------|-------------|-------------------|
| Published apps | 3 | 25 | Unlimited |
| Generations per month | 20 | 200 | Unlimited |
| Custom subdomain | Yes | Yes | Yes |
| Custom domain | No | Yes | Yes |
| Remove Sotally badge | No | Yes | Yes |
| Priority generation queue | No | Yes | Yes |
| Analytics retention | 30 days | 1 year | Unlimited |
| Support | Community | Email | Priority |

Platform subscriptions use standard Stripe Subscriptions (not Connect). The subscription status is checked server-side before allowing app creation or publishing beyond free tier limits.

```sql
ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free'; -- free, pro, business
ALTER TABLE users ADD COLUMN subscription_stripe_id TEXT;
ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMPTZ;
```

### Phase 3 Exit Criteria

- [ ] Creator can set an app to paid (one-time or subscription)
- [ ] End-user can purchase a paid app via Stripe Checkout
- [ ] Creator receives 85% of revenue in their Stripe Connect account
- [ ] Platform subscription tiers enforce limits (app count, generation count)
- [ ] Revenue dashboard shows accurate, real-time data
- [ ] Refund flow works (creator or platform can initiate)
- [ ] At least one test transaction has flowed end-to-end: end-user pays, creator receives payout

---

## 10.5 Phase 4: Growth and Social (Weeks 15-20)

**Goal:** Network effects begin. Creators get organic discovery. End-users follow creators and see a feed.

### Week 15-16: Follow/Like/Share

**Social Graph Tables:**

```sql
CREATE TABLE follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE app_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, app_id)
);

-- Denormalized counters for performance
ALTER TABLE users ADD COLUMN follower_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN following_count INT DEFAULT 0;
ALTER TABLE apps ADD COLUMN like_count INT DEFAULT 0;
```

Counters updated via Postgres triggers (not application code) to prevent drift.

**Share Mechanism:**

- Each app and storefront gets an OG-tagged URL for social sharing
- Share buttons generate platform-specific URLs (Twitter, LinkedIn, WhatsApp, copy link)
- UTM parameters track share attribution: `?ref=share&src=twitter&creator=name`

### Week 17-18: Discovery Algorithm

**Ranking Signals (weighted):**

| Signal | Weight | Description |
|--------|--------|-------------|
| Recency | 0.25 | Newer apps rank higher (exponential decay, half-life 7 days) |
| Usage | 0.30 | Unique users in last 7 days |
| Quality | 0.20 | Session duration > 30s (indicates real usage, not bounce) |
| Social | 0.15 | Likes + shares in last 7 days |
| Creator authority | 0.10 | Creator follower count, total app usage |

**Discovery Surfaces:**

- `sotally.com/explore` — Trending apps across all niches
- `sotally.com/explore/[niche]` — Trending within niche
- `sotally.com/new` — Recently published
- `sotally.com/feed` (authenticated) — Apps from followed creators + algorithmic recommendations

The ranking is computed as a materialized score, refreshed every 15 minutes via a Supabase Edge Function on a cron schedule. The score is stored on the `apps` table to avoid expensive joins on read:

```sql
ALTER TABLE apps ADD COLUMN discovery_score FLOAT DEFAULT 0;
ALTER TABLE apps ADD COLUMN discovery_score_updated_at TIMESTAMPTZ;
CREATE INDEX idx_apps_discovery ON apps(niche, discovery_score DESC) WHERE status = 'published';
```

### Week 18-19: Creator Posts and Community Feed

Creators can post updates (text + optional image) to their storefront and the platform feed. This gives creators a reason to return daily and gives end-users a reason to follow.

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  app_id UUID REFERENCES apps(id),  -- optional: link a post to an app
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Week 19-20: Niche Landing Pages and Referrals

**10 Niche Landing Pages:**

Each niche gets a dedicated page at `sotally.com/for/[niche]` (not `/explore/[niche]`, which is the browse page). The landing page is marketing-focused:

- Hero section: "Build [niche] apps your clients will love"
- 3 example apps (from seed content) with live previews
- Creator testimonials (from beta users or fabricated for launch, clearly marked)
- "Create Your First App" CTA that pre-selects the niche in onboarding
- SEO-optimized meta tags, schema markup for the niche

These are statically generated at build time. Content managed via a simple JSON config, not a CMS.

**Referral System:**

Re-purpose V1 referral tables. New incentive structure:

- Creator refers creator: Both get 1 month of Pro free
- Creator refers end-user: Creator gets analytics credit
- Referral tracking via `?ref=[creator_subdomain]` parameter, stored in cookie for 30 days

### Phase 4 Exit Criteria

- [ ] End-users can follow creators and like apps
- [ ] Follow/like counts display accurately on storefronts and app pages
- [ ] Explore page ranks apps by discovery score, updated every 15 minutes
- [ ] Niche landing pages are live for all 12 niches with seed apps
- [ ] Creator posts appear on storefront and in follower feeds
- [ ] Share buttons generate correct OG-tagged URLs
- [ ] Referral tracking works end-to-end

---

## 10.6 Phase 5: Scale and Moat (Weeks 21-30)

**Goal:** Build defensible advantages that make Sotally hard to replicate and creators hard to leave.

### Week 21-24: App Composability

**The highest-leverage moat feature.** Apps can declare outputs and consume inputs from other apps, creating a data mesh unique to each creator's storefront.

Example: A fitness trainer's "Meal Planner" app outputs a calorie target. Their "Workout Generator" app consumes that calorie target to adjust exercise intensity. An end-user using both apps gets an integrated experience that no single app provides.

**Implementation:**

```typescript
// App manifest (generated alongside the app, stored in metadata)
interface AppManifest {
  inputs: { key: string; type: 'number' | 'string' | 'json'; description: string }[];
  outputs: { key: string; type: 'number' | 'string' | 'json'; description: string }[];
}
```

The Sotally SDK is extended:

```typescript
window.Sotally.compose = {
  // Publish an output value (other apps can read it)
  emit: (key: string, value: any) => void,
  // Subscribe to an output from another app
  consume: (appSlug: string, key: string, callback: (value: any) => void) => void,
};
```

Data flows through the parent storefront frame via `postMessage`, never directly between iframe sandboxes. The storefront maintains an in-memory data bus.

### Week 24-26: App Templates Marketplace

Creators can save any app as a "template" that other creators can clone and customize. Templates are the app's prompt + any iteration history, not the generated code (since code is re-generated from prompts, ensuring templates work with future model improvements).

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id),
  creator_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  niche TEXT,
  price_cents INT DEFAULT 0,       -- 0 = free template
  use_count INT DEFAULT 0,
  prompt_chain JSONB NOT NULL,     -- array of prompts that built this app
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Revenue split for paid templates: 70% template creator, 15% platform, 15% to the creator who uses it (as a discount incentive — effectively the buyer pays 85% of listed price).

### Week 26-28: API Access

A public REST API that allows developers to programmatically create and manage apps. This opens Sotally as infrastructure, not just a UI tool.

**Endpoints:**

```
POST   /api/v1/apps              — Generate a new app from prompt
GET    /api/v1/apps/:id          — Get app details
PATCH  /api/v1/apps/:id          — Update app (re-generate with new prompt)
POST   /api/v1/apps/:id/publish  — Publish an app
DELETE /api/v1/apps/:id          — Archive an app
GET    /api/v1/apps              — List creator's apps
GET    /api/v1/analytics/:appId  — Get app analytics
```

Authentication via API keys (one key per creator, rotatable). Rate limits per subscription tier:

| Tier | Requests/minute | Generations/day |
|------|----------------|-----------------|
| Free | 10 | 5 |
| Pro | 60 | 50 |
| Business | 300 | Unlimited |

### Week 28-30: Advanced AI and Custom Domains

**Auto-improvement:** The platform analyzes apps with high bounce rates and suggests prompt modifications to improve them. This is a batch job that runs nightly:

1. Query apps with > 50 views and > 70% bounce rate
2. For each, send the app's prompt + analytics summary to Claude
3. Claude suggests 2-3 prompt modifications
4. Surface suggestions in the creator dashboard as "AI Suggestions"
5. Creator can accept (re-generates the app) or dismiss

**Custom Domains:**

Business-tier creators can map their own domain to their storefront.

```sql
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  verification_status TEXT DEFAULT 'pending', -- pending, verified, failed
  verification_token TEXT,
  ssl_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ
);
```

Verification flow: Creator adds a CNAME record pointing their domain to `domains.sotally.com`. Platform checks DNS propagation. Once verified, Vercel automatically provisions an SSL certificate. The middleware is extended to look up custom domains in addition to subdomains.

### Phase 5 Exit Criteria

- [ ] App composability works: two apps on the same storefront can share data
- [ ] Template marketplace has at least 20 templates across 5 niches
- [ ] Public API is documented and serves real requests
- [ ] AI auto-improvement suggestions appear for qualifying apps
- [ ] Custom domain mapping works end-to-end with SSL
- [ ] Platform handles 1,000 concurrent app users without degradation

---

## 10.7 Timeline Summary

```
Week  1-2   ████  Phase 0: Foundation
Week  3-6   ████████  Phase 1: Core Creation Loop
Week  7-10  ████████  Phase 2: End-User Experience
Week 11-14  ████████  Phase 3: Monetization
Week 15-20  ████████████  Phase 4: Growth & Social
Week 21-30  ████████████████████  Phase 5: Scale & Moat
```

Total: 30 weeks (approximately 7 months) from start to full-featured platform. The MVP (Phase 0 + Phase 1) ships in 6 weeks. Revenue capability ships in 14 weeks. Every phase has a deployable, usable increment.

---

# 11. Go-To-Market Strategy (Technical)

This section covers the engineering work required to support marketing and growth. It is not a marketing plan; it is the technical infrastructure that makes the marketing plan executable.

---

## 11.1 Parallel Niche Launch Architecture

Launching 12 niches simultaneously means the platform cannot have any niche-specific hardcoding. Every niche-aware feature must be data-driven.

**Niche Configuration Schema:**

```typescript
// config/niches.ts — single source of truth
interface NicheConfig {
  slug: string;                    // URL-safe identifier
  displayName: string;             // "Wellness Coaches"
  shortName: string;               // "Wellness"
  description: string;             // One-liner for meta tags
  heroHeadline: string;            // Landing page H1
  heroSubheadline: string;         // Landing page subtitle
  examplePrompts: string[];        // 5 prompts shown in onboarding
  seedAppIds: string[];            // IDs of pre-generated seed apps
  color: string;                   // Brand color for niche pages
  icon: string;                    // Emoji or icon identifier
  keywords: string[];              // SEO keywords
  creatorNoun: string;             // "coach", "trainer", "teacher"
  audienceNoun: string;            // "clients", "students", "followers"
}

const NICHES: NicheConfig[] = [
  {
    slug: 'wellness',
    displayName: 'Wellness Coaches',
    shortName: 'Wellness',
    heroHeadline: 'Build wellness apps your clients actually use',
    heroSubheadline: 'Describe what you need. Get a working app in 60 seconds.',
    examplePrompts: [
      'A meditation timer with ambient sounds and session history',
      'A mood tracker that shows weekly patterns as a chart',
      'A habit tracker for my 30-day wellness challenge',
      'A breathwork guide with animated breathing circles',
      'A water intake tracker with daily reminders display',
    ],
    creatorNoun: 'coach',
    audienceNoun: 'clients',
    // ...
  },
  // ... 11 more
];
```

**Niche Landing Pages (`sotally.com/for/[niche]`):**

These are statically generated at build time using the niche config. One Next.js page component serves all 12:

```
pages/for/[niche].tsx
  → getStaticPaths returns 12 slugs
    → getStaticProps loads niche config + seed apps
      → Renders: hero, example apps, prompts, CTA
```

Each landing page includes:
- `<title>Build [Niche] Apps | Sotally</title>`
- Open Graph image (pre-generated per niche using Satori/Vercel OG)
- JSON-LD schema for SoftwareApplication
- Canonical URL and hreflang tags

**Niche-Specific Onboarding:**

When a creator signs up from a niche landing page (tracked via `?niche=wellness` parameter or referrer), the onboarding flow is pre-configured:

1. Skip "What kind of creator are you?" — already known
2. Show niche-specific example prompts instead of generic ones
3. Pre-select the niche in the app creation flow
4. First-run prompt suggestion: "Try: [random niche example prompt]"

The niche parameter is stored in the user record at signup and used for personalization throughout the platform.

---

## 11.2 Seed Content Strategy

Seed apps serve two purposes: they demonstrate the platform's capabilities to new visitors, and they populate niche pages so they do not look empty at launch.

**Generation Plan:**

| Niche | Seed Apps | Priority |
|-------|-----------|----------|
| Wellness Coaches | 5 | P0 |
| Fitness Trainers | 5 | P0 |
| Educators | 5 | P0 |
| Finance Coaches | 5 | P0 |
| Astrologers | 4 | P1 |
| Nutritionists | 4 | P1 |
| Parenting Coaches | 4 | P1 |
| Language Teachers | 4 | P1 |
| Small Business Coaches | 4 | P2 |
| Real Estate Agents | 4 | P2 |
| Content Creators | 3 | P2 |
| Creative Freelancers | 3 | P2 |
| **Total** | **50** | |

**Seed App Quality Bar:**

Each seed app must:
- Be generated through the actual platform pipeline (not hand-coded)
- Work correctly on mobile and desktop
- Have a clear title and description
- Demonstrate a real use case that the niche creator would actually want
- Be polished enough that a visitor thinks "I want something like this"

**Generation Process (pre-launch sprint):**

1. Write 50 detailed prompts (one per seed app), informed by actual niche research
2. Run each through the generation pipeline
3. Iterate until the app meets the quality bar (typically 2-3 iterations)
4. Take screenshots (automated via Puppeteer at 3 viewport sizes)
5. Write descriptions (AI-assisted, human-reviewed)
6. Attribute to "Sotally Team" account (a system creator with a Sotally-branded storefront)

**Seed App Prompt Examples:**

| Niche | Prompt | Expected App |
|-------|--------|-------------|
| Wellness | "A 7-day meditation challenge tracker with daily guided prompts, completion checkmarks, and a streak counter" | Interactive checklist with motivational content |
| Fitness | "A workout timer for HIIT training with customizable intervals, rest periods, sound alerts, and session summary" | Functional interval timer with audio |
| Finance | "A compound interest calculator that shows growth over time as a chart, with inputs for principal, rate, and monthly contributions" | Interactive calculator with Recharts visualization |
| Astrology | "A birth chart input form that collects date, time, and place of birth, then displays the 12 house positions with descriptions" | Form + zodiac wheel display |
| Education | "A flashcard app for vocabulary learning with spaced repetition scheduling, flip animation, and progress tracking" | Fully functional flashcard system |

---

## 11.3 Creator Acquisition Funnel (Technical Implementation)

```
┌──────────────────────────────────────────────────────────────┐
│                     ACQUISITION FUNNEL                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Ad / Social Post (niche-specific)                          │
│    ↓  UTM: ?utm_source=instagram&utm_niche=wellness         │
│  Niche Landing Page (sotally.com/for/wellness)              │
│    ↓  CTA click tracked: analytics.track('cta_click')       │
│  Signup (email or OAuth)                                     │
│    ↓  Niche stored on user record                           │
│  Onboarding (niche-specific prompts shown)                  │
│    ↓  First prompt submitted: analytics.track('first_gen')  │
│  Generation (60-second wait with progress)                   │
│    ↓  Generation complete: analytics.track('gen_complete')  │
│  Preview + Iterate                                          │
│    ↓  Publish clicked: analytics.track('first_publish')     │
│  App Live at name.sotally.com/app/slug                      │
│    ↓  Share triggered: analytics.track('first_share')       │
│  Creator shares with audience → audience visits              │
│    ↓  End-user signup: analytics.track('eu_signup')         │
│  Creator sees usage → creates more apps                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**UTM Tracking Infrastructure:**

- All inbound links include UTM parameters
- UTM data captured in a `utm_captures` table at signup
- First-touch and last-touch attribution both stored
- Dashboard for internal team shows CAC by niche, by channel

```sql
CREATE TABLE utm_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_niche TEXT,                   -- custom parameter
  referrer_url TEXT,
  landing_page TEXT,
  touch_type TEXT,                  -- 'first' or 'last'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Time-to-First-App Optimization:**

The single most important metric is time from signup to first published app. Every second of friction in this path is a potential drop-off. Engineering priorities:

1. OAuth signup (Google) completes in one click — no email verification step
2. Subdomain claim is embedded in signup, not a separate step
3. Onboarding shows a pre-filled prompt that the creator can edit and submit immediately
4. Generation progress is shown in real-time (SSE) — no polling, no page refresh
5. "Publish" is a single button, no additional form fields required
6. Target: under 3 minutes from ad click to published app

---

## 11.4 Analytics and Success Metrics

### Platform-Level Metrics (Internal Dashboard)

**North Star Metrics:**

| Metric | Definition | Target (Month 1) | Target (Month 6) |
|--------|-----------|-------------------|-------------------|
| Weekly Active Creators | Creators who generated or published an app in the last 7 days | 200 | 5,000 |
| Apps Published (cumulative) | Total published apps | 500 | 50,000 |
| Monthly End-User Sessions | Unique sessions across all apps | 5,000 | 500,000 |
| Creator Revenue (GMV) | Total payments processed for creator apps | $500 | $100,000 |

**Funnel Metrics (tracked per niche):**

| Stage | Metric | How Measured |
|-------|--------|-------------|
| Awareness | Landing page visits | Vercel Analytics |
| Signup | Signup conversion rate | `users` table count / page visits |
| Activation | Time to first app | Diff between `users.created_at` and first `apps.published_at` |
| Activation | First-app publish rate | Users with at least 1 published app / total signups |
| Engagement | Apps per creator (monthly) | Count of apps created per creator per month |
| Retention | Week 1 / Week 4 / Week 12 creator retention | Cohort analysis on `apps.created_at` |
| Revenue | Paid app conversion rate | Purchases / total app views for paid apps |
| Referral | Viral coefficient | New signups from referral / referring creators |

**Niche Performance Comparison:**

A dedicated internal view that shows all funnel metrics broken down by niche. This drives resource allocation decisions: double down on niches that work, deprioritize or pivot niches that do not.

```sql
-- Materialized view, refreshed daily
CREATE MATERIALIZED VIEW niche_metrics AS
SELECT
  u.niche,
  COUNT(DISTINCT u.id) AS total_creators,
  COUNT(DISTINCT a.id) AS total_apps,
  COUNT(DISTINCT CASE WHEN a.published_at IS NOT NULL THEN a.id END) AS published_apps,
  AVG(EXTRACT(EPOCH FROM (
    (SELECT MIN(published_at) FROM apps WHERE creator_id = u.id)
    - u.created_at
  ))) AS avg_time_to_first_app_seconds,
  COUNT(DISTINCT p.id) AS total_purchases,
  COALESCE(SUM(p.amount_cents), 0) AS total_revenue_cents
FROM users u
LEFT JOIN apps a ON a.creator_id = u.id
LEFT JOIN purchases p ON p.app_id = a.id AND p.status = 'succeeded'
WHERE u.role = 'creator'
GROUP BY u.niche;
```

### Creator-Facing Analytics

Creators see a simplified version of their analytics in their dashboard. The emphasis is on actionable metrics that encourage them to create more apps and share them.

**Dashboard Cards:**

- Total views (with sparkline showing trend)
- Total users (unique, with growth percentage)
- Top app (by views this week)
- Revenue this month (if any paid apps)

**Per-App Analytics Page:**

- Views over time (line chart, last 30 days)
- Users (unique visitors)
- Avg session duration
- Geographic breakdown (top 5 countries)
- Referrer breakdown (how users found this app: direct, social, search)

---

# 12. Security, Legal, and Compliance

---

## 12.1 App Security Model

Generated apps run untrusted code. The security model assumes every generated app is potentially malicious and contains it accordingly.

### Sandbox Architecture

```
┌─────────────────────────────────┐
│  Storefront (parent frame)      │
│  Origin: creator.sotally.com    │
│                                 │
│  ┌───────────────────────────┐  │
│  │  App iframe (sandboxed)   │  │
│  │  Origin: apps.sotally.com │  │ ← different origin
│  │  /render/{appId}/{version}│  │
│  │                           │  │
│  │  sandbox="allow-scripts"  │  │ ← no allow-same-origin
│  │  CSP enforced at server   │  │
│  └───────────────────────────┘  │
│                                 │
│  PostMessage bridge (validated) │
└─────────────────────────────────┘
```

Key decisions:

1. **Separate origin for app rendering.** Apps are served from `apps.sotally.com`, not the creator's subdomain. This prevents any generated code from accessing cookies, localStorage, or auth tokens on the storefront origin.

2. **Sandbox attribute without `allow-same-origin`.** The iframe cannot access its own origin's storage. All persistence goes through the postMessage bridge to the Sotally SDK, which is controlled by the parent frame.

3. **Content Security Policy (served with every app HTML):**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
  img-src 'self' data: blob:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'none';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
```

The critical line is `connect-src 'none'`. Generated apps cannot make any network requests. They cannot call external APIs, load remote resources, or exfiltrate data. All data exchange happens through the postMessage bridge, which the platform controls.

4. **PostMessage validation.** The parent frame only accepts messages from the app iframe's origin (`apps.sotally.com`) and only processes messages that match the SDK's message schema. Unknown message types are silently dropped.

```typescript
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://apps.sotally.com') return;
  if (!isValidSDKMessage(event.data)) return;
  handleSDKMessage(event.data);
});
```

### Pre-Deployment Code Scanning

Before any generated app is built and deployed, the validator runs these checks:

| Check | Blocks Deploy | Rationale |
|-------|--------------|-----------|
| `eval()`, `new Function()` | Yes | Arbitrary code execution |
| `document.cookie` access | Yes | Cookie theft (defense in depth) |
| `XMLHttpRequest`, `fetch`, `WebSocket` | Yes | Network access (CSP is primary defense, this is belt-and-suspenders) |
| `<script src="...">` tags | Yes | External script injection |
| `<iframe>` tags in generated code | Yes | Nested frame attacks |
| `window.parent`, `window.top` access | Yes | Frame-busting or parent frame manipulation |
| `postMessage` direct calls | Yes | Only the injected SDK should use postMessage |
| Import from non-allowlisted package | Yes | Supply chain risk |
| Bundle size > 2MB | Yes | DoS via resource exhaustion |
| `dangerouslySetInnerHTML` with variable input | Warning | XSS risk within the app itself |

### Rate Limiting

| Resource | Limit | Scope |
|----------|-------|-------|
| App generation requests | 20/hour (Free), 100/hour (Pro) | Per creator |
| App page views | 1000/minute | Per app |
| SDK storage operations | 100/minute | Per user per app |
| SDK storage size | 5MB | Per user per app |
| API requests | See Section 10.6 | Per API key |

Rate limiting is implemented at the edge (Vercel Edge Middleware) for page views and at the API layer (express-rate-limit or equivalent) for SDK operations. Redis (Upstash) stores rate limit counters.

### Incident Response for Malicious Apps

If a generated app bypasses security controls:

1. **Immediate:** Platform can set any app's status to `flagged`, which disables serving instantly (middleware checks status before serving)
2. **Within 1 hour:** Investigate the bypass, determine if it affects other apps
3. **Within 24 hours:** Patch the validator to catch the bypass pattern, re-scan all existing apps
4. **Post-incident:** Add regression test to the validator test suite

---

## 12.2 Content Moderation

### Automated Moderation Pipeline

Every generated app passes through content moderation before publishing:

```
App generation complete
  → Text extraction (all visible strings in the generated code)
    → LLM content classification (Claude Haiku — fast, cheap)
      → Categories: clean, suggestive, hate_speech, violence, illegal, spam
        → clean: auto-approve
        → suggestive: auto-approve with age gate flag
        → hate_speech/violence/illegal: block publish, notify creator
        → spam: block publish, flag creator account for review
```

**What gets scanned:**
- App title and description
- All string literals in generated code
- Alt text and aria-labels
- Any text rendered by the app (extracted via static analysis of JSX)

**LLM Classification Prompt:**

```
Classify the following text content from a web application.
Respond with exactly one category: clean, suggestive, hate_speech, violence, illegal, spam.

Content:
---
{extracted_text}
---

Category:
```

Cost estimate: ~$0.001 per app scan using Claude Haiku. At 1,000 apps/day, that is $1/day.

### Manual Review Queue

Apps flagged by automated moderation or user reports enter a manual review queue. The internal moderation dashboard shows:

- Flagged app with preview
- Reason for flag (automated category or user report text)
- Creator history (previous flags, account age)
- Actions: Approve, Reject (with reason), Suspend Creator

For the first 6 months (low volume), the founding team handles moderation. At scale, consider a third-party moderation service or dedicated hire.

### User Reporting

Every app page includes a "Report" button (flag icon in the bottom bar). Reports are stored and deduplicated:

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id),
  reason TEXT NOT NULL,            -- 'inappropriate', 'spam', 'copyright', 'other'
  details TEXT,
  status TEXT DEFAULT 'pending',   -- pending, reviewed, action_taken, dismissed
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

An app receiving 3 or more reports from distinct users is automatically unpublished and placed in the review queue.

### Takedown Process

1. App is flagged (automated, user report, or legal request)
2. App is immediately unpublished (removed from storefront, returns 404)
3. Creator is notified via email with the reason
4. Creator can appeal within 14 days
5. If appeal is denied or no appeal filed, app is permanently deleted
6. Repeat offenders (3 takedowns) trigger account suspension

---

## 12.3 Data Privacy

### GDPR Compliance

**Data Controller/Processor Roles:**
- Sotally is the data controller for platform data (user accounts, analytics)
- Sotally is the data processor for app-specific user data (acting on behalf of the creator)
- Creators are data controllers for their end-users' in-app data

**User Rights Implementation:**

| Right | Implementation |
|-------|---------------|
| Right to access | User can export all their data from Settings (JSON download) |
| Right to deletion | User can delete their account; triggers cascading delete of all data within 30 days |
| Right to portability | Data export includes all app data, purchases, analytics in machine-readable format |
| Right to rectification | User can edit all profile fields |
| Right to restrict processing | User can disable analytics tracking per-app |

**Account Deletion Flow:**

```
User requests deletion (Settings > Delete Account)
  → Confirmation email sent
    → User confirms via link
      → Account marked as `deletion_pending`
        → 72-hour grace period (user can cancel)
          → Automated job runs:
            - Delete all user rows from: apps, posts, follows, likes, purchases, analytics_events
            - Delete storage objects (app bundles, avatars)
            - Anonymize any remaining references (e.g., purchase history for tax records: replace name with "Deleted User")
            - Delete user record
          → Confirmation email: "Your data has been deleted"
```

**Data Retention Schedule:**

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| User account data | Until deletion requested | Active use |
| Published app bundles | Until app archived + 30 days | Creator may re-publish |
| Analytics events | 13 months (rolling) | Trend analysis; GDPR minimization |
| Generation job logs | 90 days | Debugging |
| Payment records | 7 years | Tax and legal compliance |
| Moderation records | 3 years | Pattern detection, legal defense |
| Server logs | 30 days | Operational debugging |

### Per-App Data Isolation

End-user data stored via the Sotally SDK is isolated at the database level:

```sql
CREATE TABLE app_user_data (
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (app_id, user_id, key)
);
```

Row-level security (RLS) policies enforce that:
- An app can only read/write data for its own `app_id`
- A user can only read/write their own `user_id` rows
- Creators can read (but not write) their app's user data, for analytics purposes
- The platform admin role can access all data for moderation

```sql
-- RLS policy: users can only access their own data within an app
CREATE POLICY app_user_data_user_policy ON app_user_data
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policy: creators can read their app's data
CREATE POLICY app_user_data_creator_read ON app_user_data
  FOR SELECT
  USING (
    app_id IN (SELECT id FROM apps WHERE creator_id = auth.uid())
  );
```

### Cookie and Tracking Policy

- Platform cookies: session token (httpOnly, secure, sameSite=strict), CSRF token
- Analytics: first-party only (no Google Analytics, no third-party pixels)
- Cookie consent banner: shown to EU users (detected via Vercel's `x-vercel-ip-country` header)
- No tracking across different creator storefronts

---

## 12.4 Legal Structure

### Creator Agreement (Terms of Service)

Key clauses that must be in the creator TOS:

1. **Content Responsibility.** Creator is responsible for the content their apps display, even if generated by AI. Creator must review before publishing.

2. **Prohibited Content.** No apps that promote violence, hate speech, illegal activity, copyright infringement, or deceptive practices. Platform reserves the right to remove without notice.

3. **Revenue Share.** Platform retains 15% of all app revenue. This percentage is locked for 2 years from account creation (price stability guarantee to early creators).

4. **Distribution License.** Creator grants Sotally a non-exclusive, worldwide license to host, display, cache, and distribute their apps on the platform. This license terminates when the creator deletes their app.

5. **Account Termination.** Platform can terminate for TOS violations. Creator receives earned, unpaid revenue within 30 days of termination. App data is deleted per the retention schedule.

6. **Dispute Resolution.** Binding arbitration for disputes under $10,000. Court proceedings for larger amounts.

### End-User Terms of Service

Key clauses:

1. **Data Usage.** End-user data within apps is subject to both Sotally's privacy policy and the creator's privacy policy (if they have one).
2. **Purchases.** Refund policy: 7-day refund window for one-time purchases. Subscriptions can be canceled anytime; no refund for current period.
3. **Account.** Users must be 13+ (16+ in EU). One account per person.
4. **Liability.** Sotally is not liable for the accuracy or functionality of creator apps. Apps are provided "as is."

### Stripe Connect Compliance

Requirements for operating a marketplace with Stripe Connect:

- **KYC/KYB.** Stripe handles identity verification for creators during Connect onboarding. Platform does not store identity documents.
- **1099-K Reporting (US).** Stripe reports payments to creators earning > $600/year to the IRS. Platform must collect and provide Tax IDs (SSN or EIN) from US creators. This is handled by Stripe's onboarding flow.
- **PCI Compliance.** Platform never touches credit card numbers. All payment processing happens on Stripe's hosted Checkout pages. Platform is SAQ-A compliant (no card data storage or processing).
- **Payout Timing.** Stripe Express accounts have standard 2-day payout schedules. Platform does not hold funds beyond Stripe's standard processing.

### International Considerations

| Region | Requirement | Implementation |
|--------|-------------|----------------|
| EU | GDPR | Covered in Section 12.3 |
| EU | VAT on digital services | Stripe Tax handles VAT calculation and collection |
| India | GST on platform fees | Stripe Tax + accounting integration |
| US | Sales tax on digital goods | Stripe Tax (varies by state) |
| UK | UK GDPR (post-Brexit) | Same as GDPR implementation |
| Global | DMCA takedown compliance | Process in Section 12.2 covers this |

---

## 12.5 Intellectual Property and Ownership

### Who Owns What

| Asset | Owner | Platform Rights |
|-------|-------|----------------|
| Generated app code | Creator | Non-exclusive distribution license (terminates on deletion) |
| App prompt/description | Creator | Same as above |
| App screenshots (auto-generated) | Creator | Same as above |
| Creator profile content | Creator | Display license |
| End-user data within apps | End-user | Storage and processing (as data processor) |
| Platform UI, branding, infrastructure | Sotally | N/A |
| AI model output | Creator (per Anthropic's terms: output belongs to the user who prompted it) | Distribution license |
| App templates shared by creators | Template creator | Distribution license + revenue share per template terms |

### AI-Generated Code Ownership

The platform takes no IP claim over AI-generated code. This is a deliberate competitive advantage:

- Creators can export their app code at any time (download as zip)
- Creators can use exported code outside Sotally (no lock-in)
- If a creator leaves, they take their code with them
- This is possible because the platform's moat is distribution and community, not code ownership

Export is available from the App Studio: "Download Source" button generates a zip with:
- `App.tsx` (the generated component)
- `index.html` (the shell with Tailwind + React CDN links)
- `README.md` (attribution note, not required, just courtesy)

### Copyright Infringement Handling (DMCA)

1. **Designated Agent.** Register a DMCA agent with the US Copyright Office (required for safe harbor protection under Section 512).
2. **Takedown Process.** 
   - Receive complaint via `legal@sotally.com` or in-app report
   - Verify complaint meets DMCA requirements (identification of copyrighted work, identification of infringing material, good-faith statement)
   - Remove or disable access to the app within 24 hours
   - Notify the creator
3. **Counter-Notice.** Creator can file a counter-notice. If valid, app is restored in 10-14 business days unless the complainant files suit.
4. **Repeat Infringers.** Three valid DMCA complaints result in permanent account termination.

### Platform Content (Seed Apps, Templates)

Seed apps created by the "Sotally Team" account are owned by the platform and licensed under Creative Commons BY 4.0. Creators can clone and modify them freely, and the modified version belongs to the creator.

