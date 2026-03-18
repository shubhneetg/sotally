# Sotally — Flaws & Fixes Checklist

Living document. Address before/during build. Ranked by severity for $1B mass-adoption goal.

---

## CRITICAL — Must fix before launch

| # | Flaw | Fix | Status |
|---|------|-----|--------|
| 1 | ~~Credit system is a barrier — requires pre-purchase before any value~~ | V2 pivot: replaced credits with direct Stripe payments (one-time purchase, subscription). Free tier apps require no payment. | DONE (V2) |
| 2 | ~~No sustainable free tier — 50 credits = trial, not free tier~~ | V2: creators can publish free apps. Platform has Free/Pro/Business tiers. Free tier allows unlimited app creation, up to 5 published apps. | DONE (V2) |
| 3 | ~~Beachhead too crowded — AI marketing = saturated category~~ | V2 pivot: Sotally is now an app creation platform (not a tool marketplace). Creators describe apps in English, AI generates them. Unique positioning. | DONE (V2) |
| 4 | ~~No moat against AI chatbots — Tier 1 tools are just prompt wrappers~~ | V2: apps are real React applications with persistent state, data storage, and shareable URLs. Not prompt wrappers. | DONE (V2) |
| 5 | No affiliate system — missing key growth engine | Lifetime affiliate commission (10% of referred user spend). Full dashboard. 4th user role. | TODO |
| 6 | ~~Legal/tax complexity ignored~~ | Using Stripe Connect as payment infrastructure. Stripe handles tax computation and compliance for Connect platforms. | DONE (V2) |

## HIGH — Significantly limits growth

| # | Flaw | Fix | Status |
|---|------|-----|--------|
| 7 | ~~Review process kills creator momentum (24hr wait)~~ | V2: no review process. Apps publish instantly. Post-publication moderation only. | DONE (V2) |
| 8 | No mobile strategy (60%+ traffic is mobile) | Mobile-first responsive design. PWA. Apple Pay / Google Pay via Stripe Checkout. | PARTIAL — Stripe handles mobile payments, but PWA not implemented |
| 9 | ~~No social/viral features~~ | V2: follow creators, like apps, activity feed, share URLs with creator subdomain routing. | DONE (V2) |
| 10 | ~~"Anyone can create" is harder than claimed~~ | V2: describe your app in English, AI generates it. Template system lets users clone existing apps. Zero technical skill needed. | DONE (V2) |
| 11 | No discovery/recommendation algorithm | "Similar tools", "Users also ran", rising tools, personalized recommendations. Currently relying on full-text search, niche browse, and featured flags. | PARTIAL — search + explore + featured exist |
| 12 | ~~Timeline unrealistic (12 weeks = fantasy)~~ | V2 is built and running. Monorepo with web + API + shared packages. | DONE (V2) |

## MEDIUM — Should fix, not blockers

| # | Flaw | Fix | Status |
|---|------|-----|--------|
| 13 | ~~Over-engineered tech stack for MVP~~ | V2 uses a pragmatic stack: Hono API, Next.js, PostgreSQL, Redis, BullMQ, MinIO. All justified. | DONE (V2) |
| 14 | ~~Single VPS = single point of failure~~ | Architecture supports scaling: separate DB, workers, and API. Phase 2 plan documented in deployment guide. | PARTIAL — single VPS for now, scaling plan ready |
| 15 | ~~Payout minimum too high ($50) for new creators~~ | V2: Stripe Connect Express handles payouts directly. No platform-level minimum. | DONE (V2) |
| 16 | No internationalization | Design for i18n day 1. Auto-translate descriptions. Local currencies. | TODO |
| 17 | ~~No streaming output (users expect real-time)~~ | V2: SSE endpoint for generation streaming. Real-time status updates during app generation. | DONE (V2) |
| 18 | No SEO implementation details | Structured data, dynamic meta tags, sitemap, OG images from day 1. | TODO |
| 19 | No customer support plan | Self-service help center + Discord + AI chatbot. | TODO |
| 20 | No product analytics infrastructure | PostHog from day 1. Track key funnels. | TODO |
| 21 | ~~No LLM cost controls (multi-step tools can lose money)~~ | V2: generation is platform-side cost (not per-credit). Token usage tracked per generation. Concurrency limited via GENERATION_CONCURRENCY. | DONE (V2) |
| 22 | ~~Creator/buyer accounts too separate~~ | V2: single account type. Everyone can create and consume. No "become a creator" gate. | DONE (V2) |
| 23 | No quality decay / cleanup for bad tools | Auto-delist low-rated apps. Rolling performance window. | TODO |
| 24 | ~~No rate limiting strategy~~ | Per-user generation limits needed. Caddy provides base DDoS protection. | PARTIAL — infrastructure ready, per-user limits TODO |
| 25 | ~~"Tool" metaphor may limit platform~~ | V2: renamed everything to "apps". Platform creates full applications, not just prompt-based tools. | DONE (V2) |
| 26 | No demand signals for creators | "Tools in demand" page. User request board. Bounties table exists in schema. | PARTIAL — bounties schema exists |
| 27 | No creator data portability | JSON export of app configs. Prompt history available via generations API. | PARTIAL |
| 28 | No creator onboarding for "what to build" | Suggested app ideas based on profile. Gap analysis. Template browse as inspiration. | PARTIAL — templates exist |

---

## V2-SPECIFIC — New issues introduced by V2 architecture

| # | Flaw | Fix | Priority | Status |
|---|------|-----|----------|--------|
| V1 | Apps are single-file React with Babel standalone compilation | Not optimal for production. No tree-shaking, no code splitting, larger bundle sizes. Move to server-side Vite/esbuild compilation. | HIGH | TODO |
| V2 | No proper image/asset support in generated apps | Generated apps cannot include images, icons, or static assets. Need asset upload + CDN pipeline. | HIGH | TODO |
| V3 | Search is basic PostgreSQL tsvector | Works for early scale but no typo tolerance, faceted search, or relevance tuning. Migrate to Typesense or Algolia when at 10K+ apps. | MEDIUM | TODO |
| V4 | No email verification on signup | Users can register with any email. Add email verification flow (send code, verify before enabling generation). | MEDIUM | TODO |
| V5 | No proper error recovery UI in generation flow | When generation fails, user sees a generic error. Need: retry button, error explanation, prompt suggestions. | MEDIUM | TODO |
| V6 | Rate limiting on generation API needed per user tier | Free users should have daily generation limits. Pro/Business get higher limits. Currently no per-user rate limiting on generation. | HIGH | TODO |
| V7 | Templates table created inline via raw SQL | The templates table is CREATE TABLE IF NOT EXISTS in the route handler. Should be in Drizzle schema with proper migrations. | LOW | TODO |
| V8 | No app versioning UI | Version history exists in the database (appVersions table) but there's no UI to browse/rollback to previous versions. | MEDIUM | TODO |
| V9 | MinIO console exposed on port 9001 in production | docker-compose.yml exposes MinIO console publicly. Remove the ports mapping for production. | LOW | TODO |
| V10 | No webhook handler for Stripe events | Checkout sessions complete but there's no webhook endpoint processing `checkout.session.completed` to finalize purchases and subscriptions. | CRITICAL | TODO |

---

*This is a living document. Items move between tiers as the platform evolves and user feedback comes in. Last reviewed: 2026-03-18.*
