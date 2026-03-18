# Sotally V2: Multi-Model Enhancement Analysis

> Generated 2026-03-18 by Opus (strategy), Haiku (growth), Sonnet (UX) — 60 ideas total

---

## Opus — Product Strategy (20 Ideas)

### Top 5 (Impact 5/5)

1. **Live App Wall Homepage** — Replace hero text with 12-20 real apps running in miniature iframes. TikTok opens to video, not an explainer. [medium]
2. **Public Earnings Ticker** — "A creator in Fitness just earned $4.20" live feed on homepage. Gumroad playbook. [medium]
3. **"Invite 3 Testers" Post-Publish** — Generate shareable links + pre-written messages for WhatsApp/Twitter/email. Testers leave micro-reviews. Each gets prompted to create their own app. [medium]
4. **"First Dollar" Challenge** — Structured path: set price → share with 10 → first sale. Milestone card when they earn $1. [medium]
5. **"Made with Sotally" Watermark** — Free-tier apps show footer link. Clicking → creation page with niche pre-selected. Pro removes it. Mailchimp/Wix playbook. [quick]

### Also Notable
- "Who's Using Your App" real-time map (someone in Mumbai just used your tracker)
- App Request Board (users tell creators what to build, upvote)
- "Try 3 Apps Before Signup" with loss aversion (disappear in 24h)
- Vanity URL celebration after first publish
- Niche-specific SEO landing pages
- Remix chain family trees (visible fork history)
- Weekly digest with peer comparison
- "Claim This Niche" for empty categories
- App Impact Score (0-100 composite metric)
- Creator-to-Creator shoutouts

---

## Haiku — Growth Hacks (20 Ideas)

### Virality Mechanics
1. Spotify Wrapped-style share cards for app results + earnings [quick]
2. One-click fork/remix button on every app [quick]
3. "Powered by Sotally" watermark — removable at $100/mo [quick]
4. Social cards for every execution linking to tool page [medium]
5. Embeddable leaderboard widget for creator sites [quick]

### Creator Recruitment
6. Creator Bounty — 500 credits to use, 1000 back if you create [medium]
7. "Invite a Creator" referral with visible mentorship chains [quick]
8. Creator Incubator cohorts — 10/month with daily prompts + 70% payout [medium]
9. Template Creator tier — 5+ tools = template publishing + 5% perpetual royalty [medium]

### User → Creator Conversion
10. "Build YOUR version" button on every app (pre-fills prompt) [quick]
11. After 10th tool use: interstitial suggesting creation [medium]
12. Weekly email to power users with earnings comparison [quick]

### Gamification
13. Creator Streaks — 3+ days = badge + 10% commission boost [quick]
14. Niche Mastery — 5 tools in same category = 2x payout [quick]
15. Daily Speed Build Challenge — fastest 10 get featured [medium]

### Social Proof & FOMO
16. Auto milestone cards at 100 runs, $100 earned, etc. [quick]
17. "Tool Hype" waitlist — 50 entries = featured placement [medium]
18. Weekly "Trending Overnight" email stories [quick]

### Revenue Transparency
19. Public earnings API — embeddable live widget [medium]
20. Revenue milestone certificates ($100, $1K, $10K) [quick]

---

## Key Theme: The Creator Flywheel

All three models converge on the same insight:

```
User discovers app → Uses it → Prompted to build own version
→ Creates app → Shares it → Brings new users
→ New users discover more apps → Cycle repeats
```

### Top 10 Quick Wins (Implement This Week)

| # | What | Source | Impact |
|---|------|--------|--------|
| 1 | "Made with Sotally" watermark on free apps | Opus+Haiku | 5 |
| 2 | "Build YOUR version" button on every app | Haiku | 5 |
| 3 | First app timer + shareable badge "Built in 47 seconds" | Opus | 4 |
| 4 | Creator streaks with badges | Haiku | 4 |
| 5 | Milestone cards (auto-generated, shareable) | Haiku | 4 |
| 6 | "Claim This Niche" banner for empty categories | Opus | 4 |
| 7 | Vanity URL celebration after first publish | Opus | 4 |
| 8 | QR code on every app page | Opus | 3 |
| 9 | Creator-to-Creator shoutout/recommend section | Opus | 3 |
| 10 | Niche mastery badge (5 tools = 2x) | Haiku | 4 |

### Top 5 High-Impact Medium Effort

| # | What | Source | Impact |
|---|------|--------|--------|
| 1 | Live App Wall homepage (real apps in miniature) | Opus | 5 |
| 2 | Public earnings ticker | Opus | 5 |
| 3 | "Invite 3 Testers" post-publish flow | Opus | 5 |
| 4 | App Request Board (demand signals) | Opus | 5 |
| 5 | "Try 3 Before Signup" with loss aversion | Opus | 5 |

---

*Sonnet UX critique pending — will be added when complete.*

---

## Sonnet — UX Audit (20 Code-Level Problems)

### CRITICAL BUGS (Impact 5/5) — These Break Core User Journeys

| # | Bug | Where | Fix |
|---|-----|-------|-----|
| 1 | **Prompt lost on redirect** — homepage prompt disappears after login redirect | `page.tsx:66-71`, `create/page.tsx:30-33` | Persist in sessionStorage or pass through URL |
| 5 | **Explore cards link to /studio** — sends consumers into creator tool, hits auth wall | `explore/page.tsx:217-218` | Link to `/storefront/[username]/[slug]` instead |
| 8 | **Homepage trending links to 404** — `/apps/[id]` route doesn't exist | `page.tsx:181` | Link to storefront app page |
| 12 | **No link after publishing** — peak emotional moment is a dead end | `studio/[appId]/page.tsx:256-258` | Add "View on storefront →" link |
| 20 | **No onboarding after first login** — users never discover their storefront | `dashboard/page.tsx:64-66` | Redirect to /onboarding if no storefront_slug |

### HIGH (Impact 4/5)

| # | Bug | Where |
|---|-----|-------|
| 3 | No time estimate during generation | `studio:33-40` |
| 6 | Follow button hidden from guests (no CTA) | `storefront:200-214` |
| 7 | Storefront has no header/footer — navigation dead end | `storefront:172` |
| 10 | Create page silently redirects, no messaging | `create:30-33` |
| 17 | No pricing shown on storefront app cards | `storefront:23-31` |

### MEDIUM (Impact 3/5)

| # | Bug | Where |
|---|-----|-------|
| 2 | Blank white flash on auth hydration | `create:92` |
| 4 | Disabled iteration input with no explanation | `studio:446-464` |
| 11 | Progress dots invisible on mobile | `studio:380-413` |
| 15 | Fake search bar links to possibly missing route | `explore:88-95` |
| 16 | iframe sandbox breaks localStorage in preview | `studio:503` |
| 18 | Follow state not initialized from server | `storefront:43` |
| 19 | Failed apps have no retry mechanism | `studio:507-515` |

---

## Combined Priority: Fix These First

1. Fix broken links (Explore→Studio, Homepage→404, Post-publish dead end)
2. Preserve prompt through login redirect
3. Add onboarding redirect for new users
4. "Made with Sotally" watermark on all free apps
5. "Build YOUR version" button on every app page

These 5 changes fix the core journey AND start the viral flywheel.
