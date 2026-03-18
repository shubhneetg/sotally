# Sotally V2: 20-Point Friction & Enhancement Analysis

> Generated 2026-03-18 | Priority: Make Sotally as frictionless as TikTok/YouTube for creators

## The Fundamental Problem

Sotally has built the infrastructure of a creator platform but missed the psychology of one. Too many gates before value, too few hooks to bring people back.

**Current flow:** Register → Welcome → Onboarding → Create → Generate → Publish = 9 steps
**Target flow:** Type prompt → See app → Sign up → Publish = 4 steps

---

## Priority Matrix

### CRITICAL — Do This Week (Impact 5)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 1 | Registration required BEFORE seeing any value | Allow anonymous generation, gate on publish/save (Canva playbook) | significant |
| 2 | Google OAuth button is dead (no onClick handler) | Implement NextAuth Google provider | medium |
| 7 | No Stripe webhook handler — purchases never finalized | Implement checkout.session.completed + invoice.paid handlers | medium |
| 8 | No app screenshots on cards — text blobs nobody clicks | Auto-generate screenshots via headless browser after generation | significant |
| 10 | Feed has no algorithm — empty for new users | Add "For You" tab with trending + niche-based recommendations | significant |
| 11 | No share buttons or OG images anywhere | Add share buttons + dynamic OG images on every app page | medium |

### HIGH — Do This Month (Impact 4-5)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 3 | V1 and V2 mixed — credits, tools, apps confusion | Purge all V1 references from user-facing pages | medium |
| 4 | Onboarding is 9 steps (should be 4) | Merge registration + subdomain into one step, auto-generate slug | medium |
| 5 | Blank textarea with no inspiration | Add prompt suggestions by niche, templates inline, "surprise me" | quick |
| 6 | Studio preview hidden on mobile (60%+ traffic) | Add Chat/Preview toggle tabs on mobile | medium |
| 12 | Monetization path hidden and complex | Add pricing to publish flow, defer Stripe Connect to first sale | significant |
| 14 | No notifications — zero re-engagement | In-app bell + email digest for follows, likes, revenue | significant |
| 15 | Subdomains not actually working in practice | Connect Caddy wildcard → Next.js middleware (architecture ready) | medium |
| 16 | Explore page shows categories, not apps | Restructure: trending apps first, niches as filter, not primary | medium |
| 19 | No remix/fork capability | "Remix this" button → pre-loads original prompt in new studio | medium |
| 20 | Generation feedback is just status dots | Stream progress via SSE with narrative ("Writing components...") | medium |

### MEDIUM — Plan for Next Sprint (Impact 3)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 9 | Apps require full navigation to try | Inline "quick try" modal with iframe | medium |
| 13 | No analytics beyond view count | Daily views/users chart, revenue trend, top apps | medium |
| 17 | No embed code for external distribution | Generate iframe snippet + "Powered by Sotally" footer | medium |
| 18 | Niche lists inconsistent across pages | Single source of truth in @sotally/shared constants | quick |

---

## Comparison to Platform Benchmarks

| Platform | Time to First Value | Sotally Equivalent |
|----------|--------------------|--------------------|
| TikTok | 0 seconds (content plays immediately) | Should: see apps on homepage without signup |
| YouTube | 0 seconds (video plays) | Should: try apps without account |
| Instagram | 1 tap to post a photo | Should: 1 prompt to create an app |
| Shopify | ~15 min to set up store | Currently: ~15 min. Target: 5 min |
| Gumroad | 3 steps: upload → price → share | Should match: describe → price → publish |

---

*This is a living document. Track fixes in FLAWS_AND_FIXES.md.*
