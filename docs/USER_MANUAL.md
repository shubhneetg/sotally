# Sotally — User Manual

> Your Software Ally. Software without subscriptions.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview) — What is Sotally, credit system, three-sided marketplace
2. [User Types & Personas](#2-user-types--personas) — 11 buyer types, 10 creator types, 3 admin types
3. [Buyer Guide](#3-buyer-guide) — Onboarding, scenarios, running tools, credits, subscriptions, BYOM, enterprise
4. [Creator Guide](#4-creator-guide) — Onboarding, builder tiers, prompt engineering, pricing, analytics, payouts, case studies, tool ideas
5. [Admin Guide](#5-admin-guide) — Dashboard, review process, escalation, fraud detection, communication templates
6. [Workflows](#6-workflows) — Visual step-by-step flows for every major action
7. [FAQ](#7-faq) — Common questions for buyers, creators, and admins
8. [Affiliate Guide](#8-affiliate-guide) — Commission structure, dashboard, tracking, marketing materials, rules
9. [Creator Storefronts & Distribution](#9-creator-storefronts--distribution) — Storefronts, custom domains, API, MCP, embeds, multi-channel access
10. [Notifications](#10-notifications) — What each user type receives, email + in-app, settings
11. [Policies & Terms](#11-policies--terms) — Acceptable use, content policy, creator terms, refunds, privacy, DMCA

---

# 1. Platform Overview

## What is Sotally?

Sotally is a credit-based marketplace for software tools. Think of it as **YouTube for software** — creators build and publish tools, users discover and run them by spending credits.

Instead of subscribing to dozens of SaaS tools at $10-50/month each, you buy credits once and spend them across any tool on the platform. Pay only for what you use.

## How the Credit System Works

Credits are the universal currency on Sotally. Everything is priced in credits.

**Money flows in:**
```
You → Buy credit package → Credits added to your wallet
```

**Credits flow within:**
```
Your wallet → Run a tool → Credits split: Creator earns + Platform fee
```

**Money flows out (for creators):**
```
Creator earnings → Payout request → Real money to creator's bank
```

### Credit Packages

| Package | Price | Credits | Bonus | Best for |
|---------|-------|---------|-------|----------|
| Starter | $10 | 100 | — | Trying out the platform |
| Popular | $25 | 275 | +10% | Regular users |
| Pro | $50 | 600 | +20% | Power users |
| Business | $100 | 1,300 | +30% | Heavy/team usage |
| Enterprise | Custom | Custom | +35%+ | Companies (invoicing available) |

New users get **50 free credits** on signup — enough to try 5-10 tools.

## The Three Sides of Sotally

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   BUYERS     │     │   CREATORS   │     │   ADMINS     │
│              │     │              │     │              │
│ Discover &   │────▶│ Build &      │◀────│ Review &     │
│ run tools    │     │ publish tools│     │ moderate     │
│              │     │              │     │              │
│ Pay credits  │────▶│ Earn credits │◀────│ Manage       │
│ per use      │     │ from usage   │     │ platform     │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

# 2. User Types & Personas

## 2.1 Buyer Types

### Hobbyist Buyer

**Profile**: Casual user who occasionally needs AI tools. Personal blogger, student, or curious explorer.

| Attribute | Detail |
|-----------|--------|
| Typical spend | $10-25/month |
| Usage pattern | 2-3 tools per week |
| Credit package | Starter ($10) |
| Key needs | Free trial, cheap tools, easy discovery |
| Example | Emma, a personal blogger who uses AI to help write posts |

**Behavior**: Signs up for free credits, tries a few tools, buys the smallest package when free credits run out. Price-sensitive. Uses tools sporadically.

**What they value most**: Low barrier to entry, free tools, clear pricing (no surprises).

---

### Professional Buyer

**Profile**: Uses tools daily for work. Marketer, salesperson, content creator, consultant.

| Attribute | Detail |
|-----------|--------|
| Typical spend | $50-100/month |
| Usage pattern | 5-10 tools daily |
| Credit package | Pro ($50) or Business ($100) |
| Key needs | Reliable tools, consistent quality, bookmarks, history |
| Example | David, a Digital Marketing Manager who uses AI for campaigns daily |

**Behavior**: Discovers Sotally through a colleague or Google search. Quickly finds 10+ tools they use regularly. Bookmarks favorites. Subscribes to 2-3 key tools. Becomes a power user. Eventually connects own API keys (BYOM) to save credits.

**What they value most**: Quality and reliability. Speed. Tools that integrate into daily workflow.

---

### Enterprise Buyer

**Profile**: Company or team that needs bulk tool access. Has budget, needs compliance and control.

| Attribute | Detail |
|-----------|--------|
| Typical spend | $500-5,000/month |
| Usage pattern | 10-50 team members using various tools |
| Credit package | Enterprise (custom, invoiced) |
| Key needs | Team management, SSO, usage reports, SLA, bulk pricing |
| Example | "GrowthCo", a 200-person company where marketing (15 people) and dev (30 people) teams all need tools |

**Behavior**: CTO or team lead evaluates platform. Pilots with 5 users. If successful, gets company account with shared credit pool. Admin controls who can use what. Needs invoicing, not credit card charges.

**What they value most**: Security, compliance, control, cost predictability, team management.

---

### Developer Buyer

**Profile**: Engineer who integrates Sotally tools into their own applications via API.

| Attribute | Detail |
|-----------|--------|
| Typical spend | $100-1,000/month (depends on app usage) |
| Usage pattern | Programmatic — their app calls tools automatically |
| Credit package | Pro or Business |
| Key needs | API docs, SDK, rate limits, webhooks, programmatic discovery |
| Example | Priya, a backend engineer who uses Sotally's "Content Generator" tool inside her own SaaS product |

**Behavior**: Discovers Sotally API. Gets API token. Tests tools programmatically. Integrates into their app. Their app's users trigger executions, credits deducted from the developer's wallet.

**What they value most**: API reliability, latency, documentation, cost predictability.

---

### Bargain Hunter

**Profile**: Uses every free tool on the internet. Will only pay if absolutely necessary.

| Attribute | Detail |
|-----------|--------|
| Typical spend | $10-20/month |
| Usage pattern | Uses free credits first, cherry-picks cheapest tools |
| Credit package | Starter ($10), infrequently |
| Key needs | Free tier, cheap tools, transparent pricing |
| Example | Tom, a freelancer who uses free online tools for everything |

**Behavior**: Signs up for free credits. Runs 10 free/cheap tools. Buys smallest package grudgingly. Compares price of every tool. Will leave if better free alternative exists.

**What they value most**: Value for money. Will become a Professional buyer if they see clear ROI.

---

### Solopreneur

**Profile**: One-person business owner. Uses AI tools to replace an entire team they can't afford. Marketer, writer, designer, analyst — all in one.

| Attribute | Detail |
|-----------|--------|
| Typical spend | $25-75/month |
| Usage pattern | 3-8 tools daily across multiple categories |
| Credit package | Popular ($25) or Pro ($50) |
| Key needs | Tools that save hours of work, variety across categories |
| Example | Maria, who's launching an online course and needs marketing copy, email sequences, social posts, and landing page copy — all this week |

**Behavior**: Heavy user during product launches or campaign periods. Uses tools across many categories. Thinks in terms of "this tool saved me $200 of agency costs." Willing to pay if ROI is clear.

**What they value most**: Time savings. Tools that replace hiring a freelancer.

---

### Content Creator

**Profile**: YouTuber, blogger, podcaster, or social media influencer. Creates content regularly and needs AI assistance.

| Attribute | Detail |
|-----------|--------|
| Typical spend | $25-50/month |
| Usage pattern | 3-5 tools per content piece, 2-4 pieces per week |
| Credit package | Popular ($25) or Pro ($50) |
| Key needs | Content repurposing, scripting, SEO, social media scheduling |
| Example | Lisa, a YouTuber with 100K subscribers who needs scripts, thumbnails ideas, SEO titles, and newsletter content weekly |

**Behavior**: Consistent weekly usage pattern. Uses the same 5-10 tools repeatedly. Values speed — needs content NOW. Will subscribe to tools they use every week.

**What they value most**: Consistency, speed, and tools that understand their content format.

---

### Agency Buyer

**Profile**: Marketing, design, or consulting agency that uses tools on behalf of clients. Needs volume, consistency, and white-label results.

| Attribute | Detail |
|-----------|--------|
| Typical spend | $200-1,000/month |
| Usage pattern | Bulk processing for multiple clients |
| Credit package | Business ($100) or Enterprise (custom) |
| Key needs | Bulk execution, consistent quality, client reporting, white-label |
| Example | "GrowthLab", a digital agency running AI tools for 15 clients — blog outlines, competitor analyses, email campaigns |

**Behavior**: Processes hundreds of tool runs per month. Needs predictable costs (client billing depends on it). May have junior team members running tools daily. Cares about output consistency — clients expect uniform quality.

**What they value most**: Volume pricing, consistency, the ability to deliver more client work faster.

---

### Reseller

**Profile**: Uses Sotally tools to deliver services on other platforms (Fiverr, Upwork, or directly to clients). The tool output becomes their deliverable.

| Attribute | Detail |
|-----------|--------|
| Typical spend | $100-500/month |
| Usage pattern | Runs tools per client order, 5-30 runs/day |
| Credit package | Pro ($50) or Business ($100) |
| Key needs | High-quality output, customization options, speed |
| Example | Tom offers "AI-powered email writing" on Fiverr for $15/email, uses Sotally tools at $0.42/run |

**Behavior**: Runs a tool, polishes the output slightly, delivers to their client. Profit margin is high. Very price-sensitive — each credit is a direct cost. Prefers tools with customization options (tiers) so they can offer "basic" vs "premium" to their clients.

**What they value most**: Profit margin. Quality that's good enough to resell with minimal editing.

---

### Student / Researcher

**Profile**: Academic user. Needs research assistance, paper summarization, data analysis. Very budget-conscious.

| Attribute | Detail |
|-----------|--------|
| Typical spend | $10-25/month |
| Usage pattern | Sporadic — heavy during paper deadlines, light otherwise |
| Credit package | Starter ($10) |
| Key needs | Summarizers, citation tools, research assistants, data analyzers |
| Example | Raj, a PhD student writing his thesis — needs to summarize 20 papers, format citations, and analyze survey data |

**Behavior**: Uses free credits first. Buys credits only when deadline pressure hits. Uses academic-focused tools. May use the same tool dozens of times in one session.

**What they value most**: Affordability. Academic-specific tools. No subscription commitment.

---

### Non-Profit / NGO Buyer

**Profile**: Budget-constrained organization that needs tools but can't afford SaaS subscriptions.

| Attribute | Detail |
|-----------|--------|
| Typical spend | $10-50/month |
| Usage pattern | Grant writing, report generation, data analysis — project-based |
| Credit package | Starter or Popular |
| Key needs | Grant writing tools, report generators, data visualizers |
| Example | A small environmental NGO that needs help writing grant applications and analyzing survey data |

**Behavior**: Irregular usage, tied to project cycles. Very cost-conscious. The credit model is perfect for them — they don't waste money during quiet periods. May qualify for special nonprofit pricing.

**What they value most**: Pay-per-use model (no waste), tools for report/grant writing.

---

## 2.2 Creator Types

### Prompt Expert (Non-Technical Creator)

**Profile**: Domain expert with no coding skills. Knows their field deeply. Understands how to write effective AI prompts.

| Attribute | Detail |
|-----------|--------|
| Technical skill | None required |
| Builder tier | Tier 1 (Form-only / Prompt Template) |
| Tools they create | AI text generators, analyzers, formatters |
| Revenue model | Per-run (high volume, low price) |
| Example | Sarah, a marketing consultant with 10 years of email marketing experience |

**How they create**: Pick a template. Write an expert prompt with variables like `{{company}}` and `{{product}}`. Add input fields. Set a price. Publish.

**Earning potential**: A popular tool at 5 credits/run earning 100 runs/day = ~$870/month.

**Success factors**: Domain expertise, prompt quality, good descriptions, active optimization.

---

### Automation Builder (Semi-Technical Creator)

**Profile**: Power user familiar with tools like Zapier, Make, or IFTTT. Understands APIs at a high level. Not a programmer.

| Attribute | Detail |
|-----------|--------|
| Technical skill | Basic logic, API awareness |
| Builder tier | Tier 2 (Pipeline Builder) |
| Tools they create | Multi-step workflows combining AI + APIs + transforms |
| Revenue model | Per-run or Tiered |
| Example | Mike, a growth hacker who automates marketing workflows |

**How they create**: Build a pipeline of steps: fetch data → process with AI → transform → output. Connect steps with variables. Test. Publish.

**Earning potential**: Multi-step tools command higher prices (10-30 credits). 50 runs/day at 15 credits = ~$1,300/month.

**Success factors**: Creative problem-solving, understanding user needs, clean workflows.

---

### Developer Creator (Technical Creator)

**Profile**: Software engineer who wants to monetize utilities without building full SaaS products.

| Attribute | Detail |
|-----------|--------|
| Technical skill | Programming (Python, Node.js, etc.) |
| Builder tier | All tiers + Docker + External API |
| Tools they create | Custom algorithms, data processors, integrations |
| Revenue model | Subscription, One-time, Metered |
| Example | Alex, a full-stack developer with side projects |

**How they create**: Write code. Package as Docker container (stdin JSON → stdout JSON). Or register an external API endpoint. Configure input/output schemas on Sotally. Publish.

**Earning potential**: Technical tools command premium prices. A subscription tool at 100 credits/month with 200 subscribers = ~$1,160/month.

**Success factors**: Code quality, reliability, good documentation, responsive to user feedback.

---

### Agency Creator (Team Creator)

**Profile**: Small team (3-10 people) that creates tools professionally as a business.

| Attribute | Detail |
|-----------|--------|
| Technical skill | Mixed (designers, prompt engineers, developers) |
| Builder tier | All tiers |
| Tools they create | Professional tool suites, branded collections |
| Revenue model | Bundles, Subscriptions |
| Example | "ToolSmith Co", a 5-person team building marketing tool suites |

**How they create**: Team collaboration. Designers create tool UIs. Prompt experts write AI logic. Developers handle complex tools. Published under team brand.

**Earning potential**: A bundle of 15 tools at 300 credits/month with 500 subscribers = ~$8,700/month.

**Success factors**: Brand building, consistent quality, portfolio approach, customer support.

---

### Hobbyist Creator (Experimenter)

**Profile**: Student, learner, or tinkerer who wants to experiment with building tools.

| Attribute | Detail |
|-----------|--------|
| Technical skill | Learning |
| Builder tier | Tier 1, maybe Tier 2 |
| Tools they create | Simple tools, experiments, learning projects |
| Revenue model | Per-run, Free |
| Example | Raj, a college student learning about AI |

**How they create**: Follow tutorials. Use templates. Experiment with prompts. Publish to see if anyone uses it.

**Earning potential**: Small but growing. First tool might earn $10/month. Motivation is learning + side income.

**Success factors**: Persistence, willingness to learn from analytics, community engagement.

---

### Niche Expert Creator

**Profile**: Deep specialist in a narrow field. Creates 3-10 highly specialized tools that dominate a specific niche.

| Attribute | Detail |
|-----------|--------|
| Technical skill | Varies (domain expertise matters more than tech skill) |
| Builder tier | Tier 1 or Tier 2 |
| Tools they create | Hyper-specific tools (e.g., "Real Estate Listing Writer", "Legal Contract Clause Analyzer") |
| Revenue model | Per-run or Subscription (niche audiences pay premium) |
| Example | James, a real estate agent who creates tools specifically for real estate professionals |

**How they succeed**: They don't compete in crowded categories like "general writing." They own a niche. Every real estate agent who finds Sotally uses James's tools because there's no alternative. Low volume but high loyalty.

**Earning potential**: Niche tools can charge premium (10-30 credits). Even 50 runs/day at 20 credits = ~$1,740/month.

---

### Tool Curator / Forker

**Profile**: Doesn't create from scratch. Forks templates and optimizes them for specific audiences. Think "cover band" — not creating new music, but performing well-known songs for specific crowds.

| Attribute | Detail |
|-----------|--------|
| Technical skill | Low |
| Builder tier | Tier 1 (template-based) |
| Tools they create | Customized versions of popular templates for specific niches |
| Revenue model | Per-run (volume approach) |
| Example | Anita, who takes the "Email Generator" template and creates versions for 20 different industries |

**How they succeed**: Volume strategy. Create 20-50 niche variants. Each gets modest traffic but combined they earn well. The "long tail" approach.

**Earning potential**: 30 tools × 10 runs/day × 5 credits = ~$2,600/month.

---

### AI Researcher / Showcase Creator

**Profile**: ML engineer or AI researcher who creates tools to showcase models, techniques, or research.

| Attribute | Detail |
|-----------|--------|
| Technical skill | High (ML/AI expertise) |
| Builder tier | Docker or External API |
| Tools they create | Cutting-edge AI demos, fine-tuned model tools |
| Revenue model | Free (exposure) or Per-run (if commercial) |
| Example | Dr. Chen, who deploys a fine-tuned sentiment analysis model as a Sotally tool to gain visibility for her research |

**How they succeed**: May not prioritize revenue. Uses Sotally as a distribution platform for their research. Tools gain academic citations and industry attention. Some monetize later.

---

### SaaS Builder Creator

**Profile**: Uses Sotally AS their platform. Creates a suite of interconnected tools that together form a complete SaaS product.

| Attribute | Detail |
|-----------|--------|
| Technical skill | Medium to High |
| Builder tier | Tier 2 + Docker |
| Tools they create | Comprehensive suites (e.g., "Complete SEO Toolkit" with 10+ tools) |
| Revenue model | Subscription bundles |
| Example | "ContentFlow" — a creator who built 12 content marketing tools, bundled as a subscription at 200 credits/month |

**How they succeed**: Think like a SaaS founder but use Sotally's infrastructure instead of building their own. No server management, no auth, no billing — Sotally handles all of that. They just build great tools.

**Earning potential**: 200 credits/month bundle × 500 subscribers × 70% share = $5,800/month. This IS a SaaS business.

---

### Educator Creator

**Profile**: Teacher, tutor, or educational content creator who builds learning tools.

| Attribute | Detail |
|-----------|--------|
| Technical skill | Low to Medium |
| Builder tier | Tier 1 or Tier 2 |
| Tools they create | Quiz generators, flashcard makers, study assistants, lesson planners |
| Revenue model | Per-run or Free (for student access) |
| Example | Ms. Patel, a high school teacher who creates study tools for her students and shares them publicly |

**How they succeed**: Build tools that students and other teachers use. May offer tools for free to maximize student access and earn through volume or tips. Schools may purchase credits in bulk for classroom use.

---

## 2.3 Affiliate Types

### Growth Affiliate

**Profile**: Blogger, YouTuber, newsletter writer, or social media influencer who promotes Sotally and earns commission on referred users' spending.

| Attribute | Detail |
|-----------|--------|
| Commission | 10% of all credits spent by referred users (lifetime) |
| How they promote | Blog posts, YouTube reviews, social media, email newsletters |
| Earning potential | 100 referred users spending avg 200 credits/mo = ~$166/month passive |
| Example | Jake, a tech blogger who writes "Best AI Tools" articles with Sotally affiliate links |

---

### Super Affiliate

**Profile**: High-volume promoter. Runs paid ads, manages multiple channels, or has large audience.

| Attribute | Detail |
|-----------|--------|
| Commission | 15-20% (tiered based on volume) |
| How they promote | Paid ads, large email lists, YouTube channels with 100K+ subscribers |
| Earning potential | 1000+ referred users = $1,600+/month passive |
| Example | "MarketingPro" newsletter with 50K subscribers promoting Sotally weekly |

---

### Creator-Affiliate (Dual Role)

**Profile**: A Sotally creator who also promotes the platform. Earns both tool revenue AND affiliate commission.

| Attribute | Detail |
|-----------|--------|
| Commission | Standard affiliate rate on referred users + normal creator earnings on their tools |
| How they promote | Embed their tools on their website, share tool links on social media |
| Example | Sarah (our marketing creator) shares her tools on LinkedIn. New users sign up via her link, she earns affiliate commission on ALL their spending across the platform. |

---

## 2.4 Admin Types

### Super Admin (Platform Owner)

**Responsibilities**: Full platform control. Strategy, revenue, key decisions.

**Access**: Everything.

**Key actions**:
- Monitor platform health (GMV, users, creators, executions)
- Set platform-wide revenue share percentages
- Manage categories and featured tools
- Approve high-value payouts
- Ban/suspend accounts
- Configure platform settings (pricing, limits, features)

---

### Content Moderator

**Responsibilities**: Review submitted tools for quality and safety. Handle abuse reports.

**Access**: Tool review queue, reports queue, limited user info.

**Key actions**:
- Review and approve/reject submitted tools
- Test tools before approving
- Handle tool reports (spam, inappropriate, plagiarism)
- Issue warnings to creators
- Escalate serious issues to Super Admin

---

### Support Agent

**Responsibilities**: Help users and creators with issues. Handle credit disputes.

**Access**: User profiles, execution logs, credit transactions (read + limited write).

**Key actions**:
- Look up user accounts and execution history
- Issue manual credit refunds (within limits)
- Investigate failed executions
- Help creators with tool submission issues
- Escalate billing disputes

---

# 3. Buyer Guide

## 3.1 Buyer Onboarding (Screen by Screen)

### Screen 1: Landing Page

```
┌─────────────────────────────────────────────────────────┐
│  SOTALLY                          Login | Get Started   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│         Software without subscriptions.                 │
│                                                         │
│    1000+ tools. Pay only for what you use.              │
│                                                         │
│          [ Get Started Free — 50 Credits ]              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Marketing│  │ Data     │  │ Writing  │              │
│  │ Tools    │  │ Tools    │  │ Tools    │              │
│  │ 200+     │  │ 150+     │  │ 180+     │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  Featured Tools:                                        │
│  ┌─────────────────────────────────────────────┐        │
│  │ ⭐ Cold Email Writer  │ 4.8★ │ 10K+ runs  │        │
│  │ ⭐ SEO Analyzer       │ 4.7★ │ 8K+ runs   │        │
│  │ ⭐ Blog Outline Gen   │ 4.6★ │ 6K+ runs   │        │
│  └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Screen 2: Sign Up

```
┌───────────────────────────────────┐
│         Create your account       │
│                                   │
│  [ Continue with Google ]         │
│  [ Continue with GitHub ]         │
│                                   │
│  ──────── or ────────             │
│                                   │
│  Email: [________________]        │
│  Password: [________________]     │
│                                   │
│  [ Create Account ]               │
│                                   │
│  Already have an account? Login   │
└───────────────────────────────────┘
```

### Screen 3: Welcome & Interest Selection

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🎉 Welcome to Sotally!                                │
│                                                         │
│  You have 50 free credits to start.                     │
│                                                         │
│  What do you use tools for? (Select all that apply)     │
│                                                         │
│  [ ] Marketing & Sales                                  │
│  [ ] Content Writing                                    │
│  [ ] Software Development                               │
│  [ ] Data & Analytics                                   │
│  [ ] Design & Creative                                  │
│  [ ] Productivity & Business                            │
│  [ ] Research & Education                               │
│                                                         │
│              [ Start Exploring → ]                      │
└─────────────────────────────────────────────────────────┘
```

### Screen 4: Personalized Marketplace

```
┌─────────────────────────────────────────────────────────┐
│  SOTALLY          Search tools...      🪙 50 credits   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Recommended for you (based on: Marketing & Sales)      │
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │ 📧        │ │ 📝        │ │ 📊        │             │
│  │ Cold Email│ │ LinkedIn  │ │ SEO Meta  │             │
│  │ Writer    │ │ Post Gen  │ │ Writer    │             │
│  │           │ │           │ │           │             │
│  │ ⭐ 4.8    │ │ ⭐ 4.7    │ │ ⭐ 4.6    │             │
│  │ 5 credits │ │ 3 credits │ │ 3 credits │             │
│  │ [Try it →]│ │ [Try it →]│ │ [Try it →]│             │
│  └───────────┘ └───────────┘ └───────────┘             │
│                                                         │
│  ┌─────────────────────────────────────────────┐        │
│  │ 💡 Quick start: Try "Cold Email Writer" —   │        │
│  │    our most popular marketing tool!          │        │
│  │                     [ Try Now → ]            │        │
│  └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Screen 5: First Tool Run (Guided)

```
┌─────────────────────────────────────────────────────────┐
│  Cold Email Writer              ⭐ 4.8 │ 10K+ runs     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👋 Let's try your first tool!                         │
│                                                         │
│  Company name:     [ Acme Corp          ]  ← Fill this  │
│  Prospect name:    [ Sarah Johnson      ]               │
│  Their role:       [ VP of Marketing    ]               │
│  Your product:     [ AI Email Platform  ]               │
│  Value prop:       [ 3x email open rates]               │
│  Tone:             [ Professional ▼     ]               │
│                                                         │
│  ┌────────────────────────────────────────┐             │
│  │ Cost: 5 credits                        │             │
│  │ Your balance: 50 credits → 45 after    │             │
│  │                                        │             │
│  │         [ ▶ Run Tool ]                 │             │
│  └────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Screen 6: Result

```
┌─────────────────────────────────────────────────────────┐
│  Cold Email Writer — Result          🪙 45 credits     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✅ Generated in 3.2 seconds │ 5 credits used          │
│                                                         │
│  ┌─────────────────────────────────────────────┐        │
│  │ Subject: Quick question about Acme's Q3     │        │
│  │ growth strategy                              │        │
│  │                                              │        │
│  │ Hi Sarah,                                    │        │
│  │                                              │        │
│  │ I saw Acme Corp's impressive 40% YoY growth │        │
│  │ — congrats on the momentum. At that scale,  │        │
│  │ most VP of Marketing teams struggle with    │        │
│  │ email deliverability eating into campaign    │        │
│  │ ROI...                                       │        │
│  │                                              │        │
│  │ [Full email content]                         │        │
│  └─────────────────────────────────────────────┘        │
│                                                         │
│  [ 📋 Copy ] [ 💾 Save ] [ 🔄 Run Again ] [ ⭐ Rate ] │
│                                                         │
│  ┌─────────────────────────────────────────────┐        │
│  │ 🎉 Great first run! You have 45 credits     │        │
│  │ left. Explore more tools →                   │        │
│  └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Screen 7: Low Credits Prompt (after spending most credits)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🪙 You have 5 credits remaining                       │
│                                                         │
│  Buy more to keep using tools:                          │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │ Starter  │  │ Popular ⭐   │  │ Pro         │       │
│  │ $10      │  │ $25          │  │ $50         │       │
│  │ 100 cr   │  │ 275 cr (+10%)│  │ 600 cr(+20%)│       │
│  │ [Buy]    │  │ [Buy]        │  │ [Buy]       │       │
│  └──────────┘  └──────────────┘  └─────────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3.2 Real-World Buyer Scenarios

1. Go to sotally.com
2. Click "Get Started"
3. Sign up with:
   - Email + password, OR
   - Google account, OR
   - GitHub account
4. You'll receive **50 free credits** immediately

### Step 2: Complete Your Profile

1. Add your name and avatar (optional)
2. Choose your interests (helps with tool recommendations):
   - Marketing
   - Development
   - Writing
   - Data
   - Design
   - Productivity
   - Other

### Step 3: Explore the Marketplace

The marketplace is organized by **categories**:
- AI Writing (email, blog, social media, ad copy)
- Data Tools (CSV, JSON, scraping, enrichment)
- Marketing (SEO, analytics, lead gen, campaigns)
- Productivity (summarizers, translators, formatters)
- Development (code generators, API testers, debuggers)
- Design (image tools, color palettes, mockups)

Each category has tools sorted by:
- **Popular** — most runs in the last 7 days
- **Top Rated** — highest average rating
- **Newest** — recently published
- **Price: Low to High** — cheapest first

---

## 3.2 Real-World Buyer Scenarios

### Scenario 1: The Solopreneur Product Launch

**Maria is launching an online course this week.** She needs all her marketing materials NOW.

| Day | Task | Tool Used | Credits | Cost |
|-----|------|-----------|---------|------|
| Mon | Write 5-email sales sequence | Email Sequence Writer | 50 | $4.15 |
| Tue | Generate landing page copy | Landing Page Copywriter | 15 | $1.25 |
| Wed | Create social posts for 7 platforms | Social Media Generator | 35 | $2.90 |
| Thu | Write SEO descriptions for 10 pages | SEO Meta Writer | 30 | $2.49 |
| Fri | Generate 3 Facebook ad variants | Ad Copy Generator | 30 | $2.49 |
| **Total** | | | **160** | **$13.28** |

**Without Sotally**: She'd need Jasper ($49/mo), Copy.ai ($36/mo), a social media tool ($29/mo) = **$114/month**. With Sotally: $13.28 for the same output. 88% savings.

---

### Scenario 2: The Agency Delivering Client Work

**"GrowthLab" is a digital marketing agency** with 15 clients. They use Sotally to scale delivery.

| Client | Task | Tool | Credits |
|--------|------|------|---------|
| Client A | 50 blog post outlines | Blog Outline Generator | 250 |
| Client B | Competitor analysis (10 companies) | Competitor Analyzer | 200 |
| Client C | 20-email campaign | Cold Email Personalizer | 200 |
| Client D | 100 product descriptions | Product Description Writer | 300 |
| Client E | SEO audit for 30 pages | SEO Analyzer | 150 |
| **Total** | | | **1,100** |

**Monthly cost**: 1,100 credits = ~$85 (Business rate). They charge clients $5,000+ for this work. **98% margin.**

The agency subscribes to 5 tools they use across all clients: 5 × 50 credits/month = 250 credits/month additional.

---

### Scenario 3: The Reseller Arbitrage

**Tom offers "AI email writing" on Fiverr for $15 per email.** His workflow:

```
Client orders on Fiverr ($15)
    │
    ▼
Tom runs Cold Email Personalizer on Sotally (5 credits = $0.42)
    │
    ▼
Tom reviews output, makes minor edits (5 min)
    │
    ▼
Tom delivers to client on Fiverr
    │
    ▼
Profit: $15 - $0.42 (Sotally) - $3 (Fiverr fee) = $11.58 per order
```

10 orders/day × $11.58 = **$3,474/month**

---

### Scenario 4: The Content Creator's Weekly Workflow

**Lisa is a YouTuber (100K subscribers).** Her weekly Sotally usage:

| Day | Tool | Credits | Time Saved |
|-----|------|---------|------------|
| Monday | Video Script Generator | 10 | 3 hours |
| Tuesday | Thumbnail Idea Generator | 3 | 1 hour |
| Wednesday | SEO Title Optimizer | 3 | 30 min |
| Thursday | Video → Social Posts Repurposer | 5 | 2 hours |
| Friday | Newsletter Writer | 8 | 2 hours |
| **Weekly** | | **29** | **8.5 hours** |

**Monthly cost**: 116 credits = $9.63. **Time saved: 34 hours/month.** That's almost a full work week of writing she gets back every month.

---

### Scenario 5: The Developer Building with Sotally API

**Priya's SaaS app needs AI content moderation.** Instead of building it:

```
Priya's SaaS App
    │
    ├── User submits a post
    │
    ▼
App calls Sotally API: "Content Moderator" tool (3 credits per post)
    │
    ▼
Tool returns: { "safe": true, "category": "clean", "confidence": 0.97 }
    │
    ▼
App allows or flags the post
```

**Economics**:
- 1,000 posts/day × 3 credits = 3,000 credits/day = $249/day
- Monthly API cost: ~$7,470
- Her SaaS: 500 users × $49/month = $24,500/month
- **Net margin after Sotally: $17,030/month**

She didn't build a content moderation system. She just called one API.

---

### Scenario 6: The Student Writing a Thesis

**Raj needs to research and write his thesis** on a tight budget.

| Task | Tool | Credits |
|------|------|---------|
| Summarize 20 research papers | Paper Summarizer (3 credits each) | 60 |
| Generate literature review | Literature Review Generator | 15 |
| Format 50 citations | Citation Formatter | 2 |
| Analyze survey data (200 responses) | Survey Analyzer | 10 |
| Proofread 3 chapters | Academic Proofreader (5 credits each) | 15 |
| **Total** | | **102** |

Free credits cover 50. He buys 1 Starter pack ($10/100 credits). Total cost: **$10** for thesis assistance that would cost $200+ from a research assistant.

---

## 3.3 Running a Tool (Step by Step)

### Step 1: Find a Tool

Browse categories, use search, or follow a direct link.

### Step 2: Review the Tool Page

Every tool page shows:
- **Name & description** — what it does
- **Creator** — who made it, their rating
- **Pricing** — how much it costs (credits per run, subscription, etc.)
- **Rating** — stars (1-5) from other users
- **Run count** — how many times it's been used ("10,000+ runs")
- **Sample output** — example of what the tool produces
- **Reviews** — what other users think

### Step 3: Fill in the Input Form

Each tool has a custom input form. Fill in the required fields.

Example (Email Subject Line Generator):
```
Product: "Wireless Bluetooth Headphones"
Target Audience: "Tech-savvy millennials"
Tone: "Casual and exciting"
Number of suggestions: 5
```

### Step 4: Run

Click the **"Run"** button.

You'll see:
1. **Credit check**: "This will cost 5 credits. You have 95 credits." → Confirm
2. **Execution**: Progress indicator (usually 2-5 seconds)
3. **Result**: Output displayed on screen

### Step 5: Use the Result

- **Copy** — copy output to clipboard
- **Download** — save as file (if applicable)
- **Share** — get a shareable link to the result
- **Run Again** — modify inputs and re-run
- **Rate** — leave a review (1-5 stars + comment)

---

## 3.3 Understanding Pricing Models

When browsing tools, you'll see different pricing badges:

### Per-Run
```
⚡ 5 credits per run
```
Pay X credits each time you run the tool. Most common.

### Tiered
```
⚡ Free: Basic output
⚡ 5 credits: Full output
⚡ 15 credits: Premium (detailed + extras)
```
Choose your tier when running. Free tier lets you try before paying.

### Subscription
```
📅 50 credits/month — Unlimited runs
📅 30 credits/month — 100 runs/month
```
Subscribe for recurring access. Best for tools you use frequently. Credits auto-deducted monthly from your wallet.

### One-Time Purchase
```
🔑 200 credits — Lifetime access
```
Pay once, use the tool forever. No per-run cost after purchase.

### Metered
```
📊 2 credits base + 1 credit per 100 records
```
Cost scales with the amount of data you process.

### Free
```
✅ Free — 0 credits
```
Run for free. Usually simpler tools or demos of premium versions.

---

## 3.4 Managing Credits

### Checking Your Balance

Your credit balance is always visible in the top navigation bar:
```
🪙 275 credits
```

### Buying More Credits

1. Click your balance or go to **Dashboard → Credits**
2. Select a package
3. Pay via Stripe (credit card, Apple Pay, Google Pay)
4. Credits added instantly

### Transaction History

**Dashboard → Credits → History** shows every transaction:
```
Mar 15  -5   Email Subject Generator    Run #4521
Mar 15  -10  Website Scraper            Run #4520
Mar 14  +275 Credit Purchase            Popular Pack
Mar 14  -3   JSON Formatter             Run #4519
Mar 13  +50  Welcome Bonus              Signup
```

### Low Balance Alerts

When your balance drops below 20 credits, you'll see:
- In-app banner: "Running low! Buy credits to keep using tools."
- Email notification (optional, configurable in settings)

---

## 3.5 Subscriptions

### Subscribing to a Tool

1. On a tool page with subscription pricing, click **"Subscribe"**
2. Confirm: "50 credits/month for unlimited runs. First billing: now."
3. Credits deducted from your wallet immediately
4. Tool added to **Dashboard → My Subscriptions**

### Managing Subscriptions

**Dashboard → My Subscriptions** shows:
```
📅 SEO Dashboard         50 credits/mo    Next billing: Apr 15   [Cancel]
📅 Social Media Suite    100 credits/mo   Next billing: Apr 15   [Cancel]
```

### How Renewal Works

- On your billing date, credits are auto-deducted from your wallet
- If your wallet has insufficient credits:
  - Subscription **pauses** (not cancelled)
  - You get a notification: "Top up credits to resume your subscription"
  - Once you buy credits, subscription resumes automatically
- You can cancel anytime — access continues until end of current billing period

---

## 3.6 BYOM — Bring Your Own Model

If you have your own AI API keys (OpenAI, Anthropic, etc.), you can use them on Sotally:

### Why Use BYOM?
- **Save credits** — AI-heavy tools cost fewer credits (or free) when you bring your own key
- **Use better models** — Access GPT-4, Claude, etc. even if the tool defaults to a cheaper model
- **Privacy** — Your data goes directly to your API provider, not through Sotally

### How to Set Up BYOM

1. Go to **Dashboard → Settings → API Keys**
2. Click **"Add API Key"**
3. Select provider: OpenAI, Anthropic, Google AI, or Custom
4. Enter your API key
5. Add a label (e.g., "My OpenAI Key")
6. Click **"Save"** — key is encrypted and stored securely

Your keys are:
- Encrypted with AES-256 at rest
- Decrypted only at execution time
- Never logged or exposed in outputs
- Shown as masked in settings (sk-...xxxx)

### Using BYOM When Running Tools

When a tool supports BYOM, you'll see an option before running:
```
Model: GPT-4o-mini (platform) — 5 credits
Model: GPT-4o (your key) — 2 credits (reduced cost)
Model: Claude Sonnet (your key) — 2 credits (reduced cost)
```

Selecting your own key reduces the credit cost because the platform doesn't pay for the AI API call.

---

## 3.7 Enterprise Features

For teams and companies:

### Team Management

1. **Create a Team**: Dashboard → Team → Create Team
2. **Invite Members**: Add team members by email
3. **Shared Credit Pool**: Team has one credit wallet. Admin controls who can spend.
4. **Role Assignment**:
   - Team Admin: Manage members, buy credits, view all usage
   - Team Member: Use tools, view own usage
5. **Usage Reports**: See which team member used which tool, how many credits spent

### Enterprise Features
- **SSO**: Connect your identity provider (Okta, Auth0, Google Workspace)
- **Invoicing**: Monthly invoices instead of credit card charges
- **SLA**: Guaranteed uptime and priority execution
- **Dedicated Support**: Named account manager
- **Custom Pricing**: Volume discounts negotiated per contract
- **Data Residency**: Choose where your execution data is stored
- **Audit Logs**: Full history of all actions for compliance

Contact sales@sotally.com for enterprise plans.

---

# 4. Creator Guide

## 4.1 Creator Onboarding (Screen by Screen)

### Screen 1: Creator Studio Landing

```
┌─────────────────────────────────────────────────────────┐
│  CREATOR STUDIO                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│        Turn your expertise into income.                 │
│                                                         │
│   Build software tools without coding.                  │
│   Earn money every time someone uses your tool.         │
│                                                         │
│   ┌───────────────────────────────────────────┐         │
│   │ How it works:                             │         │
│   │                                           │         │
│   │ 1. Build a tool (5 min with templates)    │         │
│   │ 2. Set your price                         │         │
│   │ 3. Publish to marketplace                 │         │
│   │ 4. Earn credits when people use it        │         │
│   │ 5. Cash out to your bank account          │         │
│   └───────────────────────────────────────────┘         │
│                                                         │
│   Creator earnings examples:                            │
│   📧 Email Generator: $870/month (100 runs/day)       │
│   📊 SEO Dashboard: $2,900/month (1000 subscribers)   │
│   🛠️ Dev Toolkit: $4,200/month (portfolio)            │
│                                                         │
│              [ Become a Creator → ]                     │
└─────────────────────────────────────────────────────────┘
```

### Screen 2: Profile Setup

```
┌───────────────────────────────────────────────┐
│  Set up your Creator Profile                  │
│                                               │
│  This is what users see when they find you.   │
│                                               │
│  Display name: [ Sarah Mitchell       ]       │
│                                               │
│  Bio: (What's your expertise?)                │
│  [ 10 years in email marketing. Former      ] │
│  [ Director at HubSpot. I help businesses   ] │
│  [ write emails that actually get opened.   ] │
│                                               │
│  Specialization: (Choose up to 3)             │
│  [✓] Email Marketing                         │
│  [✓] Copywriting                             │
│  [ ] SEO                                      │
│  [✓] Sales                                   │
│  [ ] Social Media                             │
│                                               │
│  Website: [ sarahmitchell.com         ]       │
│  Twitter: [ @sarahwrites             ]        │
│                                               │
│           [ Save & Continue → ]               │
└───────────────────────────────────────────────┘
```

### Screen 3: Choose Creation Path

```
┌─────────────────────────────────────────────────────────┐
│  How do you want to create your first tool?             │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ 📋 Start from       │  │ ✏️ Start from       │      │
│  │    Template          │  │    Scratch           │      │
│  │                      │  │                      │      │
│  │ Pick a pre-built     │  │ Build from a blank   │      │
│  │ template and         │  │ canvas. Choose your  │      │
│  │ customize it with    │  │ builder tier.        │      │
│  │ your expertise.      │  │                      │      │
│  │                      │  │                      │      │
│  │ ⏱️ ~5 minutes        │  │ ⏱️ ~15-30 minutes    │      │
│  │ ⭐ Recommended       │  │ For experienced      │      │
│  │    for first tool    │  │ creators             │      │
│  │                      │  │                      │      │
│  │ [ Choose → ]         │  │ [ Choose → ]         │      │
│  └─────────────────────┘  └─────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### Screen 4: Template Gallery

```
┌─────────────────────────────────────────────────────────┐
│  Template Gallery              Search templates...      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📝 Text & Writing                                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │ AI Text   │ │ Email     │ │ Blog Post │             │
│  │ Generator │ │ Writer    │ │ Generator │             │
│  │           │ │           │ │           │             │
│  │ Most      │ │ Popular   │ │ Versatile │             │
│  │ popular   │ │ for       │ │ content   │             │
│  │           │ │ marketing │ │ tool      │             │
│  │ [Use →]   │ │ [Use →]   │ │ [Use →]   │             │
│  └───────────┘ └───────────┘ └───────────┘             │
│                                                         │
│  📊 Data & Analysis                                    │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │ Data      │ │ Analyzer  │ │ Formatter │             │
│  │ Processor │ │           │ │           │             │
│  │ [Use →]   │ │ [Use →]   │ │ [Use →]   │             │
│  └───────────┘ └───────────┘ └───────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Screen 5: Builder (Guided — with tooltips)

```
┌─────────────────────────────────────────────────────────┐
│  Building: Cold Email Personalizer                      │
│  Template: Email Writer │ Step 3 of 7                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌── Step 3: Write your prompt ──────────────────┐      │
│  │                                                │      │
│  │  💡 TIP: Use {{input.field}} to reference     │      │
│  │  the fields users will fill in.                │      │
│  │                                                │      │
│  │  ┌──────────────────────────────────────────┐  │      │
│  │  │ You are an expert cold email writer.     │  │      │
│  │  │                                          │  │      │
│  │  │ Write a personalized email for:          │  │      │
│  │  │ Company: {{input.company_name}}          │  │      │
│  │  │ Prospect: {{input.prospect_name}}        │  │      │
│  │  │ Their role: {{input.prospect_role}}       │  │      │
│  │  │ Our product: {{input.our_product}}       │  │      │
│  │  │                                          │  │      │
│  │  │ Keep it under 150 words...               │  │      │
│  │  └──────────────────────────────────────────┘  │      │
│  │                                                │      │
│  │  Available variables: {{input.company_name}},  │      │
│  │  {{input.prospect_name}}, {{input.tone}}       │      │
│  └────────────────────────────────────────────────┘      │
│                                                         │
│  [ ← Back ]                    [ Next: Set Pricing → ]  │
└─────────────────────────────────────────────────────────┘
```

### Screen 6: Test Before Publishing

```
┌─────────────────────────────────────────────────────────┐
│  Test Your Tool                    Step 6 of 7          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Try your tool with sample inputs:                      │
│                                                         │
│  Company: [ Acme Corp          ]                        │
│  Prospect: [ Sarah Johnson     ]                        │
│  Role: [ VP Marketing          ]                        │
│  Product: [ AI Email Platform  ]                        │
│  Tone: [ Professional ▼       ]                         │
│                                                         │
│  [ ▶ Test Run ]     (Free — testing doesn't cost)       │
│                                                         │
│  ┌─────────────────────────────────────────────┐        │
│  │ Output:                                      │        │
│  │                                              │        │
│  │ Subject: Quick question about Acme's growth  │        │
│  │                                              │        │
│  │ Hi Sarah, I noticed Acme Corp just...        │        │
│  │ [Full output]                                │        │
│  │                                              │        │
│  │ ✅ Looks good? Continue to publish.          │        │
│  │ ❌ Not satisfied? Edit your prompt.          │        │
│  └─────────────────────────────────────────────┘        │
│                                                         │
│  [ ← Edit Prompt ]              [ Submit for Review → ] │
└─────────────────────────────────────────────────────────┘
```

### Screen 7: Post-Approval

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🎉 Your tool is LIVE!                                 │
│                                                         │
│  "Cold Email Personalizer" is now in the marketplace.   │
│                                                         │
│  Tool page: sotally.com/tools/cold-email-personalizer   │
│                                                         │
│  Share it:                                              │
│  [ 🐦 Twitter ] [ 💼 LinkedIn ] [ 📋 Copy Link ]      │
│                                                         │
│  What's next?                                           │
│  → View your analytics dashboard                        │
│  → Create another tool                                  │
│  → Set up payout method (Stripe Connect)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4.2 Who Can Be a Creator?

**Anyone.** You don't need to be a developer.

- **Marketing expert?** Create AI marketing tools with your prompt expertise.
- **Writer?** Create content generation tools with your writing style.
- **Data analyst?** Create data processing tools.
- **Developer?** Create powerful tools with code.
- **Domain expert in ANY field?** Turn your knowledge into software tools.

---

## 4.3 Understanding the Tool Builder

Sotally offers **three tiers** of tool creation, from simplest to most powerful:

### Tier 1: Form-Only (Prompt Template)

**Who it's for**: Non-technical creators. Domain experts. Anyone.

**What it does**: You write an AI prompt with variables. Users fill in the variables. AI generates the output.

**How it works**:
```
Your prompt template:
"Write {{count}} email subject lines for {{product}} targeting {{audience}}.
The tone should be {{tone}}. Each subject line should be under 60 characters
and create urgency."

User fills in:
- count: 5
- product: "AI Writing Tool"
- audience: "Small business owners"
- tone: "Professional but friendly"

Tool output:
1. "Transform Your Writing in Minutes, Not Hours"
2. "Small Business Secret: AI Writing That Converts"
...
```

**Time to create**: 5-10 minutes.

---

### Tier 2: Pipeline Builder

**Who it's for**: Power users. People familiar with Zapier/Make. Semi-technical.

**What it does**: Chain multiple steps together. AI call → transform → another AI call → format → output.

**Available step types**:

| Step Type | What it does | Example |
|-----------|-------------|---------|
| LLM Call | Call an AI model with a prompt | Generate text, analyze content |
| HTTP Request | Call any external API | Fetch data, send webhooks |
| Text Transform | Manipulate text | Format, split, join, regex |
| JSON Transform | Reshape data | Extract fields, filter arrays |
| Conditional | If/else branching | Different output based on input |
| Loop | Iterate over arrays | Process each item in a list |

**Example pipeline** (Competitor Analysis Tool):
```
Step 1: HTTP Request → Fetch competitor's website
Step 2: LLM Call → "Extract key product features from this HTML: {{step1.body}}"
Step 3: LLM Call → "Compare these features with {{input.our_features}}: {{step2.features}}"
Step 4: Text Transform → Format as markdown report
Output: Competitor analysis report
```

**Time to create**: 15-30 minutes.

---

### Tier 3: Visual Flow Builder (Coming Soon)

**Who it's for**: Power creators who want visual control.

**What it does**: Drag-and-drop node editor. Same capabilities as Tier 2, but visualized as a flowchart.

---

### Docker Tools (Developer Only)

**Who it's for**: Software developers.

**What it does**: Upload a Docker container that reads JSON input from stdin and writes JSON output to stdout.

**Requirements**:
- Docker image or Dockerfile + source code
- Must read from stdin (JSON)
- Must write to stdout (JSON)
- Exit code 0 = success, non-zero = failure
- Maximum execution time: 60 seconds (configurable)

---

### External API (Developer Only)

**Who it's for**: Developers with existing services.

**What it does**: Register your own API endpoint. Sotally proxies requests to it.

**Requirements**:
- HTTPS endpoint that accepts POST requests
- Request body: JSON matching tool's input_schema
- Response body: JSON matching tool's output_schema
- Must respond within timeout (max 60 seconds)

---

## 4.3 Creating Your First Tool — Step by Step

### Step 1: Start

Go to **Creator Studio → Create New Tool**

Choose your starting point:
- **"Start from Template"** — Browse pre-built templates (recommended for first tool)
- **"Start from Scratch"** — Choose your builder tier

### Step 2: Pick a Template (if using templates)

Browse the Template Gallery by category:
```
📝 AI Text Generator — Generate any kind of text with AI
📊 Data Processor — Transform, clean, or analyze data
🔍 Analyzer — Analyze content and provide insights
📧 Email Tool — Generate or process emails
🌐 Web Tool — Interact with websites or URLs
📋 Formatter — Format or convert data between formats
```

Click a template to preview its structure, then click **"Use This Template"**.

### Step 3: Configure Basics

| Field | Description | Example |
|-------|-------------|---------|
| Tool Name | Clear, descriptive name | "Cold Email Personalizer" |
| Slug | URL-friendly name (auto-generated) | cold-email-personalizer |
| Short Description | 1-2 sentences, shown in marketplace cards | "Generate personalized cold emails that get responses" |
| Long Description | Full description (markdown supported) | Features, use cases, examples |
| Category | Primary category | Marketing > Email |
| Tags | Search keywords | cold-email, outreach, sales, personalization |
| Icon | Upload or choose from library | 📧 |

### Step 4: Define Input Fields

Add the fields users will fill in when running your tool:

| Field Type | When to use | Example |
|------------|-------------|---------|
| Text | Short single-line input | Company name, product name |
| Textarea | Long multi-line input | Product description, context |
| Number | Numeric input | "How many suggestions?" |
| Select | Choose from options | Tone: formal/casual/funny |
| Toggle | Yes/no options | "Include call-to-action?" |
| File | File upload | CSV, image, document |

For each field, configure:
- **Label**: "Company Name"
- **Placeholder**: "e.g., Acme Corp"
- **Required?**: Yes/No
- **Default value**: Optional
- **Help text**: "Enter the prospect's company name"

### Step 5: Build the Logic

**For Tier 1 (Prompt Template)**:
Write your prompt template in the editor. Use `{{input.field_name}}` to reference input fields.

```
You are an expert cold email writer. Write a personalized cold email for:

Company: {{input.company_name}}
Prospect: {{input.prospect_name}}
Their role: {{input.prospect_role}}
Our product: {{input.our_product}}
Key value proposition: {{input.value_prop}}

Requirements:
- Keep it under 150 words
- Open with a personalized hook about their company
- Mention one specific pain point their role typically faces
- Present our product as the solution
- End with a soft call-to-action
- Tone: {{input.tone}}
```

Select your AI model:
- GPT-4o-mini (platform-provided, recommended for most tools)
- GPT-4o (platform-provided, higher quality, costs more credits)
- Claude Sonnet (platform-provided)
- User's own model (BYOM — user pays their own API costs)

**For Tier 2 (Pipeline)**:
Add steps and connect them with variables. See section 4.2 for step types.

### Step 6: Add Sample Output

Provide a sample output so users can see what to expect BEFORE running your tool:

```
Subject: Quick question about Acme's Q3 growth

Hi Sarah,

I noticed Acme Corp just expanded into the European market —
congratulations on the Q3 numbers. That kind of growth usually
brings a wave of new customer support challenges...

[Full sample email]
```

### Step 7: Set Pricing

Choose your pricing model:

**Per-Run** (recommended for first tool):
- Credit cost per run: 5
- Your earnings per run: 3.5 credits (at 70% share)

**Tiered**:
- Free tier: 0 credits (limited output)
- Basic: 5 credits (full output)
- Premium: 15 credits (full output + variations)

**Other models** (subscription, one-time, metered) — available after your first tool.

**Pricing tips**:
- Check similar tools' pricing for reference
- Start lower to attract initial users, increase once you have good ratings
- Simple AI text tools: 3-8 credits
- Multi-step tools: 10-25 credits
- Complex/premium tools: 25-100 credits

### Step 8: Test Your Tool

Before publishing, test your tool:

1. Click **"Test"** in the builder
2. Fill in sample inputs
3. Review the output
4. Adjust prompt/logic if needed
5. Test with different inputs to ensure quality

Testing uses your own credits (refunded after each test).

### Step 9: Submit for Review

When you're satisfied:

1. Click **"Submit for Review"**
2. Your tool enters the moderation queue
3. A moderator will:
   - Review your tool description
   - Check the prompt/logic for quality and safety
   - Test with sample inputs
   - Approve, reject (with feedback), or request changes
4. Average review time: 24 hours
5. Once approved: your tool is **LIVE in the marketplace!**

---

## 4.4 Pricing Your Tool

### Choosing the Right Pricing Model

| If your tool is... | Use this model | Why |
|---------------------|---------------|-----|
| A simple utility (formatter, generator) | Per-run | Users want quick, one-off access |
| Something users try before buying | Tiered | Free tier drives discovery, paid tiers drive revenue |
| Used daily/weekly by the same people | Subscription | Recurring revenue, user loyalty |
| A premium, complex solution | One-time | Higher upfront value, no recurring friction |
| Processing variable amounts of data | Metered | Fair pricing based on actual usage |
| Part of a collection of related tools | Bundle | Cross-sell, higher total value |

### Revenue Share

Your earnings depend on your **Creator Level**:

| Level | Requirement | Your Share | Platform Share |
|-------|------------|------------|----------------|
| New | Default | 65% | 35% |
| Established | 100+ total runs, 4.0+ rating | 70% | 30% |
| Top | 1,000+ total runs, 4.5+ rating | 75% | 25% |
| Elite | 10,000+ total runs, invite-only | 80% | 20% |
| Founding | First 100 creators | 80% | 20% |

**Example earnings at 70% share**:
- Tool costs 5 credits → you earn 3.5 credits ($0.29)
- 100 runs/day → $29/day → **$870/month**
- 1,000 runs/day → **$8,700/month**

### Pricing Strategy Tips

1. **Start with Per-Run**: It's the easiest to understand and attracts the most users
2. **Price based on value, not cost**: If your tool saves someone 30 minutes of work, 10 credits ($0.83) is a bargain
3. **Offer a free tier**: Let users try before they buy. Free tiers drive 3-5x more traffic to your tool
4. **Watch your analytics**: If many people view but few run, your price may be too high
5. **Test different prices**: Try 5 credits for a week, then 8 credits. See what converts better
6. **Add tiers later**: Start simple (per-run), add subscription once you have loyal users

---

## 4.5 Analytics & Optimization

### Creator Dashboard

Your dashboard shows:

**Overview**:
```
Today's Earnings:     35 credits ($2.90)
This Week:           210 credits ($17.43)
This Month:        1,240 credits ($102.92)
All Time:         12,500 credits ($1,037.50)
```

**Per-Tool Metrics**:

| Tool | Runs Today | This Month | Rating | Revenue |
|------|-----------|------------|--------|---------|
| Cold Email Writer | 45 | 890 | 4.8★ | 4,450 cr |
| Subject Line Gen | 32 | 620 | 4.5★ | 1,860 cr |
| Ad Copy Creator | 18 | 340 | 4.2★ | 3,400 cr |

**Key Metrics to Monitor**:
- **Conversion rate**: Tool page views → executions (aim for 15%+)
- **Rating**: Keep above 4.0 (below 3.5 reduces visibility)
- **Repeat usage**: Users who run your tool more than once (aim for 30%+)
- **Search impressions**: How often your tool appears in search results

### Optimization Tips

1. **Improve your description**: Clear, specific descriptions with examples convert better
2. **Add sample outputs**: Users want to see what they'll get before paying
3. **Respond to reviews**: Thank positive reviewers, address negative feedback
4. **Update your prompt**: AI prompts can always be improved. Iterate based on user feedback.
5. **Use trending topics**: If "AI agents" is trending, create tools related to it
6. **Cross-promote**: Mention your other tools in descriptions ("Also try my...")

---

## 4.6 Earnings & Payouts

### How You Earn

Every time a user runs your tool (or pays for a subscription/license), your share is added to your **Creator Earnings Wallet**.

This is separate from your credit wallet (which is for buying/using other tools).

### Earnings Dashboard

```
Creator Earnings Balance: 2,500 credits ($207.50)

Recent Earnings:
Mar 15  +3.5 credits   Cold Email Writer    Run by user_xyz
Mar 15  +3.5 credits   Cold Email Writer    Run by user_abc
Mar 15  +7.0 credits   Subject Line Gen     Run by user_def
Mar 15  +50  credits   SEO Dashboard        Subscription renewal from user_ghi
```

### Requesting a Payout

1. Go to **Creator Studio → Earnings → Request Payout**
2. Minimum payout: $50 equivalent in credits
3. Select amount: all or partial
4. Payout method: Stripe Connect (bank transfer)
   - First time: complete Stripe Connect onboarding (identity verification, bank details)
5. Processing time: 1-3 business days
6. You'll receive an email when the payout completes

### Payout Schedule

| Creator Level | Payout Frequency |
|--------------|-----------------|
| New | Monthly |
| Established | Weekly |
| Top | Weekly |
| Elite / Agency | Daily |

### Tax Information

- Creators are responsible for their own tax reporting
- Sotally provides annual earnings summaries
- For US creators earning $600+/year: Sotally issues 1099-MISC
- International creators: consult your local tax advisor

---

## 4.7 Creator Levels & Growth

### How Leveling Works

Your Creator Level is determined by your tool performance:

```
New ──────────▶ Established ──────────▶ Top ──────────▶ Elite
                100+ runs               1,000+ runs      Invite-only
                4.0+ rating             4.5+ rating       10,000+ runs
                                                          4.7+ rating
```

### Benefits Per Level

| Benefit | New | Established | Top | Elite |
|---------|-----|-------------|-----|-------|
| Revenue share | 65% | 70% | 75% | 80% |
| Max tools | 5 | 50 | 100 | Unlimited |
| Featured eligible | No | Yes | Yes | Priority |
| Verified badge | No | After review | Yes | Yes |
| Pricing models | Per-run, Free | All | All | All + Custom |
| Payout frequency | Monthly | Weekly | Weekly | Daily |
| Priority support | No | No | Yes | Yes |
| Beta features | No | No | Yes | Yes |
| Analytics | Basic | Full | Full | Full + API |

### Tips for Leveling Up

1. **Quality over quantity**: One great tool beats ten mediocre ones
2. **Respond to feedback**: Update tools based on user reviews
3. **Stay active**: Regularly update and improve your tools
4. **Build a niche**: Become THE person for a specific category
5. **Promote externally**: Share your tools on social media, blogs, newsletters

---

## 4.8 Prompt Engineering Guide (for Tier 1 Creators)

Your prompt is your product. A great prompt = a great tool. Here's how to write prompts that produce excellent output.

### The Anatomy of a Great Tool Prompt

```
[Role Setting]
You are an expert [domain] with [X] years of experience in [specialty].

[Context]
You help [target user] with [specific task].

[Instructions]
Given the following information:
- {{input.field_1}}: [what this is]
- {{input.field_2}}: [what this is]

[Task]
[Specific, clear instructions for what to generate]

[Constraints]
- [Length/format requirements]
- [Tone requirements]
- [What to include]
- [What to avoid]

[Output Format]
[Specify exact output structure]

[Examples] (optional but powerful)
Example input: ...
Example output: ...
```

### 10 Prompt Engineering Tips

**1. Set a specific role**
```
❌ "Write an email"
✅ "You are a senior B2B sales consultant who has written 10,000+ cold emails
    with a 40% open rate. Write an email that..."
```

**2. Be extremely specific about the output**
```
❌ "Generate some social media posts"
✅ "Generate exactly 5 tweets. Each tweet must be under 280 characters,
    include one relevant emoji, end with a question to drive engagement,
    and use a casual but professional tone."
```

**3. Include constraints that show expertise**
```
"Email subject lines must be:
- Under 60 characters (mobile preview requirement)
- Include one power word (free, proven, exclusive, etc.)
- Avoid spam trigger words (buy, discount, limited time)
- Create curiosity without being clickbait"
```
This is where YOUR domain knowledge makes the tool valuable.

**4. Use few-shot examples**
```
"Here are examples of the quality I expect:

Input: B2B SaaS company selling CRM
Output: 'Your sales team is leaving $2M on the table (here's the math)'

Input: E-commerce store selling shoes
Output: 'The 3-second test that tells you your shoes don't fit'"
```

**5. Structure the output format explicitly**
```
"Format your response as:
## Subject Line Options
1. [subject line] — [why it works]
2. [subject line] — [why it works]
...

## Recommended Winner
[best option] — [detailed reasoning]"
```

**6. Add guardrails**
```
"IMPORTANT:
- Do NOT use clichés like 'In today's fast-paced world'
- Do NOT make claims that can't be verified
- Do NOT use ALL CAPS or excessive exclamation marks
- ALWAYS include a specific, actionable call-to-action"
```

**7. Leverage the model's strengths**
```
"Analyze the following text and identify:
1. The primary emotion being expressed
2. Three specific claims made (with exact quotes)
3. Any logical fallacies present
4. An overall credibility score (1-10) with justification"
```
AI excels at structured analysis — use that.

**8. Make {{input}} variables work hard**
Instead of just `{{input.topic}}`, add structured variables:
```
Target audience: {{input.audience}}
Their biggest pain point: {{input.pain_point}}
Desired outcome: {{input.desired_outcome}}
Tone: {{input.tone}}
Industry: {{input.industry}}
```
More variables = more customizable = more valuable tool.

**9. Test with edge cases**
Before publishing, test your prompt with:
- Very short inputs ("AI")
- Very long inputs (500 words)
- Unusual inputs (non-English, technical jargon, incomplete info)
- Adversarial inputs (users trying to break it)

**10. Iterate based on output quality**
Run your tool 20 times with different inputs. Rate each output 1-5. If average is below 4, keep refining the prompt. Small changes can dramatically improve output.

### Prompt Templates You Can Start With

**The Generator Template:**
```
You are an expert {{input.domain}} professional.
Generate {{input.count}} [things] for {{input.context}}.

Requirements:
- [Quality standard 1]
- [Quality standard 2]
- [Format requirement]
```

**The Analyzer Template:**
```
You are an expert {{input.domain}} analyst.
Analyze the following: {{input.content}}

Provide:
1. Summary (2-3 sentences)
2. Key findings (bullet points)
3. Recommendations (actionable)
4. Score/Rating (1-10 with justification)
```

**The Transformer Template:**
```
Transform the following {{input.input_type}} into {{input.output_type}}.

Input: {{input.content}}

Rules:
- Preserve the core message
- Adapt for {{input.target_audience}}
- Keep the tone {{input.tone}}
- Output length: {{input.length}}
```

---

## 4.9 Best Practices by Creator Type

### For Prompt Experts

1. **Your domain knowledge IS your moat.** The prompt is your intellectual property. A marketing expert's prompt will outperform a generic one every time.
2. **Write prompts a non-expert couldn't write.** Include industry-specific knowledge, insider tips, and proven frameworks.
3. **Treat your prompt like a recipe** — continuously improve based on user feedback and your own testing.
4. **Specialize, don't generalize.** "Email Subject Line Generator for E-commerce" beats "General Email Tool" every time.
5. **Write killer descriptions.** Your tool description is your sales copy. Include: what it does, who it's for, sample output, and why YOUR tool is better.

### For Automation Builders

1. **Test each step independently** before connecting them in a pipeline.
2. **Handle errors gracefully.** What happens if Step 2 (API call) fails? Add fallback logic.
3. **Use text transforms to clean data** between steps — APIs return messy data.
4. **Keep pipelines under 5 steps** for reliability. Each step is a potential failure point.
5. **Document your pipeline** (internal notes) so you can debug and improve later.

### For Developer Creators

1. **Keep Docker images small.** Use alpine base images. Only include needed dependencies.
2. **Handle ALL input validation** in your code. Don't trust user input.
3. **Return structured JSON** with clear, descriptive field names.
4. **Include helpful error messages** — users need to understand what went wrong.
5. **Version your tools.** Don't break existing users' workflows when you update.

### For Agency Creators

1. **Build a consistent brand** across all your tools.
2. **Cross-promote tools** in descriptions ("Works great with our Email Subject Generator").
3. **Create bundles early** — they're your competitive advantage.
4. **Maintain a release schedule** — update tools regularly to keep them relevant.
5. **Engage with users** — respond to reviews, add requested features.

### For Niche Experts

1. **Own your niche completely.** Be THE person for "Real Estate AI Tools" or "Legal Document Tools."
2. **Create a tool for every pain point** in your niche.
3. **Market where your niche hangs out** — industry forums, LinkedIn groups, newsletters.
4. **Charge premium prices** — niche audiences expect specialized value and will pay for it.
5. **Add industry-specific terminology** to your descriptions for SEO.

---

## 4.10 Common Mistakes to Avoid

| Mistake | Why it hurts | What to do instead |
|---------|-------------|-------------------|
| Vague tool description | Users don't understand what they'll get → low conversion | Include specific examples, sample output, clear use case |
| Too many input fields | Overwhelming → users abandon before running | Keep to 3-5 fields. Make non-essential fields optional. |
| Overpricing for a new tool | No ratings = no trust = no one will pay premium | Start low (3-5 credits). Raise price after 50+ positive reviews. |
| Not testing enough | Bad outputs → negative reviews → tool dies | Test with 20+ different inputs. Test edge cases. |
| Ignoring reviews | Unhappy users leave → ratings drop → visibility drops | Read every review. Address feedback. Update your tool. |
| Copying popular tools | Crowded → hard to stand out → race to the bottom | Find an angle. Different niche, better prompt, unique feature. |
| Set and forget | Tools become stale → users switch to newer tools | Review analytics monthly. Update prompts. Add improvements. |
| No sample output | Users can't judge quality → won't risk credits | Always include 1-2 sample outputs on your tool page. |
| Generic tool names | Won't rank in search → low discovery | Use specific names: "B2B Cold Email Writer" not "Email Tool" |
| Wrong category | Users in your niche won't find you | Pick the most specific category that fits. |

---

## 4.11 Creator Success Stories

### Story 1: "From Marketing Director to Tool Empire"

**Sarah, Marketing Consultant — Prompt Expert**

Sarah spent 10 years as an email marketing director. When she found Sotally, she realized her expertise could scale infinitely.

- **Month 1**: Created "Cold Email Personalizer" using Tier 1 builder. Wrote a prompt with her 10 years of email expertise baked in. 3 runs/day.
- **Month 2**: Created 4 more email tools (Subject Line Generator, Follow-Up Writer, Newsletter Opener, A/B Variant Creator). Average 15 runs/day across all tools.
- **Month 3**: Created "Email Marketing Suite" bundle — all 5 tools for 100 credits/month. Got 20 subscribers.
- **Month 6**: 12 tools total, 200 runs/day, 80 bundle subscribers. **Earning $2,800/month.**
- **Month 12**: 25 tools. Hit Top Creator level (75% revenue share). Featured on Sotally homepage. **Earning $6,500/month.** Quit consulting to go full-time on Sotally.

**Her secret**: She didn't learn to code. She packaged 10 years of email expertise into prompts that a non-expert couldn't write. The prompts include industry-specific techniques (subject line formulas, follow-up timing, personalization strategies) that make the output genuinely better than generic AI tools.

---

### Story 2: "Niche Dominator"

**James, Real Estate Agent — Niche Expert**

James was a real estate agent who hated writing listing descriptions. He created a tool for himself, then realized other agents needed it too.

- **Month 1**: Created "Real Estate Listing Description Writer." Only 5 runs/day — but every user was a real estate professional.
- **Month 3**: 8 real estate tools (listing writer, market analyzer, client email templates, open house flyer generator, property comparison, neighborhood guide, buyer persona profiler, closing letter writer).
- **Month 6**: Shared tools in real estate Facebook groups and newsletters. **500 runs/day.** Featured in Inman News (real estate publication).
- **Month 12**: 15 niche tools. "Real Estate Agent Toolkit" bundle at 200 credits/month with 100 subscribers. **Earning $7,000/month.**

**His secret**: He didn't compete in the crowded "general writing" category. He dominated one tiny niche. No one else had real estate-specific tools with MLS-standard formatting, comparable property analysis, or neighborhood description generation.

---

### Story 3: "Side Project to Full Stack Income"

**Alex, Full-Stack Developer — Developer Creator**

Alex wanted to monetize his coding skills without building and maintaining full SaaS products.

- **Month 1**: Built "Code Quality Reviewer" as a Docker tool. Analyzes code and provides improvement suggestions. 10 runs/day.
- **Month 2**: Built "API Load Tester" and "Database Query Optimizer." Offered as subscriptions (100 credits/month each).
- **Month 3**: 50 subscribers across 3 tools. **$580/month.**
- **Month 6**: 15 developer tools. Best seller: "Full-Stack Boilerplate Generator" (one-time purchase: 200 credits). 100 sales/month.
- **Month 12**: Tool portfolio earning **$4,200/month.** Reduced freelance work to focus on Sotally tools.

**His secret**: Docker tools let him use any language, any framework, any algorithm. He built things that AI-only tools couldn't do — actual code execution, real benchmarking, live API testing. Higher value = higher prices.

---

### Story 4: "The Student Builder"

**Raj, College Student — Hobbyist Creator**

Raj was studying computer science and learning about AI. He created tools as a learning exercise.

- **Month 1**: Created "Essay Outline Generator" using Tier 1. 2 runs/day. Not much, but exciting to earn anything.
- **Month 3**: Created "Study Flashcard Generator" and "Research Paper Summarizer." Shared in university Discord servers. 30 runs/day.
- **Month 6**: Tools went viral in student communities. **200 runs/day. Earning $350/month.**
- **Month 12**: Started a YouTube channel: "Build AI Tools in 5 Minutes." Channel drives traffic to his tools. Combined income from Sotally + YouTube: **$1,200/month.** Impressive for a student.

**His secret**: He built for his own needs (student tools), then his peers became his market. The YouTube channel created a flywheel — tutorials drive tool traffic, tools drive channel subscribers.

---

## 4.12 Tool Ideas by Category

Looking for inspiration? Here are tool ideas organized by category:

### Marketing Tools
- Cold email personalizer
- Email subject line generator
- LinkedIn post writer
- Blog outline creator
- SEO meta description writer
- Google/Facebook ad copy generator
- Product description writer
- Social media caption generator
- Landing page copy writer
- A/B test variant generator
- Brand voice analyzer
- Content calendar planner
- Competitor analysis summarizer
- Marketing strategy brainstormer
- Press release writer
- Customer persona builder
- Elevator pitch generator
- Testimonial request email writer
- Hashtag generator
- Newsletter content planner

### Data & Analysis Tools
- CSV cleaner / formatter
- JSON formatter / validator
- Website scraper
- Data anonymizer
- SQL query generator
- Regex generator / tester
- Survey analyzer
- Spreadsheet formula generator
- Data visualization describer
- Lead enrichment tool
- Email validator
- Phone number formatter
- Address standardizer
- Duplicate detector
- PDF data extractor

### Writing & Content Tools
- Blog post writer
- Article summarizer
- Content repurposer (blog → tweets → LinkedIn)
- Grammar / style checker
- Tone adjuster (formal ↔ casual)
- Translation tool
- Paraphraser
- Headline analyzer
- Readability scorer
- Outline generator
- Story premise generator
- Book summary writer
- Meeting notes formatter
- Technical writer assistant
- Academic citation formatter

### Development Tools
- Code reviewer
- API documentation generator
- README generator
- Git commit message writer
- SQL query optimizer
- Regex explainer
- JSON to TypeScript type generator
- Error message decoder
- Code comment generator
- Database schema designer
- API endpoint planner
- Dockerfile generator
- Environment variable documenter
- Changelog generator
- Code complexity analyzer

### Business & Productivity Tools
- Invoice generator
- Business plan writer
- SWOT analysis tool
- Job description writer
- Interview question generator
- Performance review writer
- Project brief generator
- Meeting agenda creator
- OKR/goal writer
- Proposal writer
- Contract clause explainer
- Risk assessment tool
- Decision matrix builder
- Competitive pricing analyzer
- ROI calculator

### Industry-Specific Tools
- **Real Estate**: Listing description writer, market analysis, neighborhood guide
- **Legal**: Contract reviewer, clause explainer, legal letter generator
- **Healthcare**: Patient communication writer, medical term simplifier
- **Education**: Quiz generator, lesson planner, rubric creator, flashcard maker
- **Finance**: Financial report summarizer, investment memo writer
- **HR**: Job posting optimizer, interview scorecard, onboarding checklist
- **E-commerce**: Product listing optimizer, review response writer, return policy generator

---

## 4.14 Templates & Forking

### Using Templates

Templates are pre-built tool structures that you customize with your expertise:

1. Go to **Creator Studio → Templates**
2. Browse by category
3. Preview the template (see structure, sample prompt, input fields)
4. Click **"Use Template"**
5. Customize: change the prompt, adjust inputs, set pricing
6. Publish as YOUR tool

### Forking Public Tools (Coming Soon)

Some creators mark their tools as "forkable." You can:
1. Click **"Fork This Tool"** on any forkable tool
2. Get a copy of the tool's configuration
3. Modify and improve it
4. Publish as a new tool (with attribution to original)

---

# 5. Admin Guide

## 5.1 Admin Dashboard

The admin dashboard provides a real-time overview of the platform:

### Key Metrics

```
┌─────────────────────────────────────────────────────┐
│ PLATFORM OVERVIEW                                    │
├──────────────┬──────────────┬──────────────┬────────┤
│ Total Users  │ Active Today │ Creators     │ Tools  │
│ 12,450       │ 1,230        │ 340          │ 520    │
├──────────────┼──────────────┼──────────────┼────────┤
│ Executions   │ GMV Today    │ Revenue      │ Payout │
│ Today: 5,200 │ $4,316       │ $1,295       │ $3,021 │
└──────────────┴──────────────┴──────────────┴────────┘
```

### Dashboard Sections

- **Overview**: Key metrics, charts, trends
- **Tools**: Pending reviews, active tools, flagged tools
- **Users**: User list, search, activity
- **Creators**: Creator list, earnings, levels
- **Revenue**: Credit sales, platform revenue, payouts
- **Reports**: Abuse reports, content issues
- **Settings**: Platform configuration

---

## 5.2 Tool Review Process

### Review Queue

New tools submitted by creators appear in the review queue:

```
PENDING REVIEW (12 tools)

1. "LinkedIn Post Optimizer" by Sarah M. — Submitted 2h ago
   Category: Marketing > Social Media | Tier: 1 | Price: 5 credits
   [Review] [Skip]

2. "CSV Data Cleaner" by Alex K. — Submitted 5h ago
   Category: Data > Processing | Tier: 2 | Price: 10 credits
   [Review] [Skip]
```

### Review Checklist

When reviewing a tool, check:

| Check | What to look for |
|-------|-----------------|
| **Description** | Clear, accurate, professional. No misleading claims. |
| **Input fields** | Well-labeled, appropriate for the tool's purpose. |
| **Prompt/Logic** | Good quality. No harmful content. No jailbreak attempts. |
| **Output quality** | Test with 2-3 different inputs. Is output useful? |
| **Pricing** | Reasonable for the value provided. Not exploitative. |
| **Uniqueness** | Not an exact copy of existing tool. Adds value. |
| **Category** | Correct category selection. |
| **Safety** | No tools that facilitate harm, fraud, or illegal activity. |

### Review Actions

- **Approve**: Tool goes live in marketplace immediately
- **Request Changes**: Send feedback to creator, tool stays in draft
- **Reject**: Tool is rejected with reason. Creator can revise and resubmit.
- **Flag Creator**: Mark creator's account for additional scrutiny

### Review Guidelines

**Auto-approve candidates** (fast track):
- Creator is Top/Elite level
- Tool is from a template with no major changes
- Category has low risk

**Requires careful review**:
- First tool from a new creator
- Tools that access external APIs
- Tools in sensitive categories (finance, health, legal)
- Docker-based tools

---

## 5.3 Report Handling

### Report Types

Users can report tools for:
- **Spam**: Low-quality, repetitive, or misleading
- **Inappropriate content**: Offensive, harmful, or illegal
- **Plagiarism**: Copied from another tool without attribution
- **Broken**: Tool consistently fails or produces wrong output
- **Pricing abuse**: Misleading pricing or credit drain

### Report Workflow

```
Report filed → Review queue → Investigate → Action
                                             ├── Dismiss (false report)
                                             ├── Warn creator
                                             ├── Suspend tool
                                             ├── Remove tool
                                             └── Ban creator
```

---

## 5.4 User Management

### User Lookup

Search for users by email, name, or ID:

```
USER: David Chen (david@example.com)
Role: Buyer (Professional)
Joined: Jan 15, 2026
Credit Balance: 145 credits
Total Spent: 3,200 credits
Subscriptions: 2 active
Executions: 450 total
Status: Active
```

### Admin Actions

| Action | When to use |
|--------|-------------|
| Issue credits | Compensation for platform issues or tool failures |
| Deduct credits | Fraud correction |
| Suspend account | Temporary restriction (investigation) |
| Ban account | Permanent removal (confirmed abuse) |
| Reset password | User locked out, verified identity |
| Upgrade to creator | Manual creator approval |

---

## 5.5 Detailed Review Criteria

### Quality Scorecard

Every tool is scored across 5 dimensions. Must score **15+/25 to approve**.

| Dimension | Score | Criteria |
|-----------|-------|----------|
| **Description** (0-5) | 5: Clear, compelling, includes sample output. 3: Adequate. 1: Vague or misleading. 0: Missing. |
| **Input Design** (0-5) | 5: Well-labeled, appropriate fields, good defaults. 3: Functional. 1: Confusing. 0: Broken. |
| **Output Quality** (0-5) | 5: Excellent, useful, well-formatted. 3: Acceptable. 1: Low quality. 0: Broken/empty. |
| **Pricing** (0-5) | 5: Fair value, well-positioned. 3: Reasonable. 1: Over/underpriced. 0: Exploitative. |
| **Safety** (0-5) | 5: No concerns. 3: Minor issues (fixable). 1: Significant concerns. 0: Dangerous/illegal. |

### Red Flags (Auto-reject or escalate)

- Prompt injection attempts (trying to override system instructions)
- Data harvesting (tool requests sensitive personal info without clear need)
- Misleading claims ("guaranteed results", "100% accurate")
- Exact copy of existing tool (plagiarism)
- Very low effort (template with zero customization)
- Tool impersonates another service ("Unofficial ChatGPT", "Google SEO Tool")
- Tools facilitating: spam, fraud, harassment, illegal activity
- CSAM or explicit content involving minors (immediate ban)

### Fast-Track Approval Candidates

Tools from **Top/Elite creators** with:
- Template-based (Tier 1) creation
- Category previously reviewed for this creator
- No external API calls
- Price within normal range

These can be approved in under 1 hour by any moderator.

### Sensitive Categories (Require Senior Review)

- **Finance**: Investment advice, tax tools, financial analysis
- **Health**: Medical advice, diagnosis, health recommendations
- **Legal**: Contract generation, legal advice, compliance
- **Education**: Academic tools (plagiarism concerns)
- **Data Processing**: Tools that handle personal data

---

## 5.6 Escalation Procedures

### Escalation Matrix

```
Level 1: Moderator
├── Standard tool reviews
├── Simple abuse reports
├── Low-risk tool approvals
│
Level 2: Senior Moderator
├── Disputed rejections (creator appeals)
├── Repeat offender creators
├── Sensitive category tools
├── Complex abuse reports
│
Level 3: Admin (Super Admin)
├── Creator account bans
├── Platform policy violations
├── High-value payout disputes
├── Feature/partnership decisions
│
Level 4: Legal / Founder
├── DMCA takedown requests
├── Law enforcement data requests
├── Data breach incidents
├── Terms of service legal questions
```

### When to Escalate

| Situation | Escalate to |
|-----------|------------|
| Creator argues rejection was unfair | Level 2 |
| Same creator has 3+ rejected tools | Level 2 |
| Tool in finance/health/legal | Level 2 |
| Tool appears to steal user data | Level 3 |
| Creator threatens legal action | Level 4 |
| User reports tool caused real-world harm | Level 3 → Level 4 |
| DMCA takedown notice received | Level 4 |
| Suspicious bulk account creation | Level 3 |

### Response Time SLAs

| Priority | Response Time | Resolution Time |
|----------|--------------|-----------------|
| Critical (safety issue, data breach) | 1 hour | 4 hours |
| High (tool causing harm, creator fraud) | 4 hours | 24 hours |
| Medium (disputed review, content issue) | 24 hours | 3 days |
| Low (feature request, minor complaint) | 48 hours | 7 days |

---

## 5.7 Communication Templates

### Tool Approved

```
Subject: 🎉 Your tool "{tool_name}" is now live!

Hi {creator_name},

Great news! Your tool "{tool_name}" has been reviewed and approved.
It's now live in the Sotally marketplace.

Tool page: {tool_url}

Tips for getting your first users:
- Share the link on your social media
- Add it to your website or portfolio
- Engage with early reviews

Good luck!
— The Sotally Team
```

### Tool Rejected (with feedback)

```
Subject: Review feedback for "{tool_name}"

Hi {creator_name},

We reviewed "{tool_name}" and unfortunately it doesn't meet our
quality standards at this time.

Issues found:
{specific_issues}

How to fix it:
{specific_suggestions}

You can update your tool in Creator Studio and resubmit for review.
We're happy to review again once changes are made.

Need help? Reply to this email or visit our Creator Help Center.

— The Sotally Team
```

### Creator Warning

```
Subject: Important notice about your Sotally account

Hi {creator_name},

We've received {number} reports about your tool "{tool_name}"
regarding {issue_category}.

Specifically: {details}

Please address this within 7 days. If the issue is not resolved,
the tool may be suspended.

If you believe this is a mistake, please reply with your explanation.

— The Sotally Team
```

### Tool Suspension

```
Subject: Your tool "{tool_name}" has been suspended

Hi {creator_name},

We've suspended your tool "{tool_name}" due to {reason}.

This means:
- The tool is no longer visible in the marketplace
- Active subscriptions will be paused (users are not charged)
- Existing users will see a "Tool unavailable" message

Next steps:
- If you can fix the issue: Update the tool and contact us to re-review
- If you disagree: Reply to this email with your explanation

— The Sotally Team
```

---

## 5.8 Fraud Detection

### Signals to Watch For

| Signal | Type | Action |
|--------|------|--------|
| Multiple accounts from same IP buying credits | Credit fraud | Flag, investigate |
| Creator running their own tool repeatedly | Self-dealing | Warn, deduct inflated earnings |
| Bulk 5-star reviews from new accounts | Fake reviews | Remove reviews, warn creator |
| Chargeback after credits spent | Payment fraud | Suspend, recover credits |
| Tool that only works for the creator | Scam | Remove tool, warn |
| Identical tools from different accounts | Multi-accounting | Merge accounts or ban |
| Rapid tool creation (50+ in a day) | Spam | Rate limit, review |
| API abuse (extreme rate) | Abuse | Rate limit, warn |

### Automated Detection (Future)

- Anomaly detection on execution patterns
- Review sentiment analysis (detect fake positive reviews)
- IP/fingerprint clustering for multi-account detection
- Credit flow analysis (circular credit movements)

---

## 5.9 Platform Settings

### Configurable Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Revenue share (New) | Platform share for new creators | 35% |
| Revenue share (Established) | Platform share for established creators | 30% |
| Revenue share (Top) | Platform share for top creators | 25% |
| Free signup credits | Credits given on new account | 50 |
| Min tool price | Minimum credits per run | 1 |
| Max tool price | Maximum credits per run | 1000 |
| Review required | Require mod review before publishing | Yes |
| Max execution time | Maximum tool run time (seconds) | 60 |
| Payout minimum | Minimum credits for payout request | 600 (~$50) |

---

# 6. Workflows

## 6.1 Buyer: First-Time Experience

```
Visit sotally.com
    │
    ▼
See landing page with featured tools
    │
    ▼
Click "Get Started Free"
    │
    ▼
Sign up (email/Google/GitHub)
    │
    ▼
Receive 50 free credits
    │
    ▼
See personalized marketplace (based on interest selection)
    │
    ▼
Click on a tool → View tool page
    │
    ▼
Click "Run" → Fill inputs → Confirm credit cost
    │
    ▼
See result (2-5 seconds)
    │
    ▼
Impressed? → Browse more tools → Credits run out
    │
    ▼
Buy credit package → Continue using
```

## 6.2 Creator: Publishing a Tool

```
Go to Creator Studio
    │
    ▼
Click "Create New Tool"
    │
    ▼
Choose: Template or From Scratch
    │
    ├── Template: Browse gallery → Pick template → Customize
    │
    └── Scratch: Choose tier → Build from blank
    │
    ▼
Configure: Name, description, category, tags
    │
    ▼
Define input fields (what users fill in)
    │
    ▼
Build logic (write prompt / build pipeline / upload code)
    │
    ▼
Add sample output
    │
    ▼
Set pricing (per-run / tiered / subscription / etc.)
    │
    ▼
Test with sample inputs (refine until satisfied)
    │
    ▼
Submit for review
    │
    ▼
Wait for moderator (avg 24h)
    │
    ├── Approved → LIVE in marketplace! 🎉
    │
    ├── Changes requested → Revise → Resubmit
    │
    └── Rejected → Read feedback → Create better tool
```

## 6.3 Credit Lifecycle

```
User buys $50 credit package
    │
    ▼
+600 credits added to wallet
    │
    ▼
User runs "Email Generator" (5 credits)
    │
    ├── Hold: -5 credits from wallet
    │
    ▼
    Tool executes...
    │
    ├── SUCCESS:
    │   ├── User: -5 credits confirmed
    │   ├── Creator: +3.5 credits to earnings wallet
    │   └── Platform: +1.5 credits revenue
    │
    └── FAILURE:
        └── User: +5 credits refunded to wallet
```

## 6.4 Subscription Lifecycle

```
User subscribes to "SEO Dashboard" (50 credits/month)
    │
    ▼
-50 credits deducted from wallet
    │
    ▼
User can run tool unlimited times for 30 days
    │
    ▼
Day 30: Auto-renewal
    │
    ├── Wallet has 50+ credits → Renew → Continue access
    │
    └── Wallet insufficient → Pause subscription
        │
        ▼
        User buys credits → Subscription auto-resumes
        │
        OR
        │
        User cancels → Access until end of paid period
```

## 6.5 Creator Payout

```
Creator's tool earns credits over time
    │
    ▼
Earnings wallet: 2,500 credits ($207.50)
    │
    ▼
Creator clicks "Request Payout"
    │
    ▼
First time? → Complete Stripe Connect onboarding
    │
    ▼
Select amount → Confirm
    │
    ▼
Platform processes payout (1-3 business days)
    │
    ▼
Money arrives in creator's bank account
    │
    ▼
Creator receives confirmation email
```

---

# 7. FAQ

## For Buyers

**Q: Do credits expire?**
A: No. Credits never expire. Use them whenever you want.

**Q: What happens if a tool fails?**
A: You get a full credit refund. Credits are only charged on successful execution.

**Q: Can I get a refund on credits I purchased?**
A: Unused credits can be refunded within 30 days of purchase. Contact support.

**Q: Can I use tools without signing up?**
A: You need an account to run tools, but you can browse the marketplace without one.

**Q: How do I know if a tool is good?**
A: Check the rating (aim for 4.0+), read reviews, look at run count (more runs = more trusted), and review the sample output.

**Q: What's BYOM and should I use it?**
A: BYOM (Bring Your Own Model) lets you use your own AI API keys. It saves credits on AI-heavy tools and gives you model choice. Use it if you already have API keys.

---

## For Creators

**Q: How much can I earn?**
A: It depends on your tool's popularity and pricing. A tool with 100 runs/day at 5 credits earns ~$870/month. Top creators earn $5,000-10,000+/month.

**Q: Do I need to know how to code?**
A: No! Tier 1 (Prompt Template) requires zero coding. If you can write a good AI prompt, you can create a tool.

**Q: How long until my tool is approved?**
A: Average review time is 24 hours. Simple tools from experienced creators may be approved faster.

**Q: Can someone copy my tool?**
A: Your tool's internal prompt/logic is not visible to users. If you suspect plagiarism, file a report.

**Q: Who pays for the AI API calls?**
A: The platform covers AI costs for platform-provided models. The cost is factored into the platform's share. If users bring their own keys (BYOM), they pay their own API costs and the tool costs fewer credits.

**Q: When can I get paid?**
A: Request a payout once your earnings reach $50. New creators get monthly payouts. Higher-level creators get weekly or daily payouts.

---

## For Admins

**Q: How do we handle a tool that's producing harmful content?**
A: Immediately suspend the tool. Investigate the prompt/logic. If intentional, ban the creator. If accidental, work with creator to fix and re-review.

**Q: What if a creator disputes their revenue share?**
A: All transactions are logged in the append-only ledger. Pull the transaction history for the disputed period and review with the creator.

**Q: How do we handle a credit card chargeback?**
A: Stripe handles the dispute process. If chargeback is approved, deduct the credits from the user's wallet. If wallet is insufficient, suspend the account until resolved.

---

---

# 8. Affiliate Guide

## 8.1 What is the Sotally Affiliate Program?

Earn money by bringing users to Sotally. When someone signs up through your unique link, you earn a percentage of **everything they spend on the platform** — for as long as they're active.

This isn't a one-time referral bonus. It's **lifetime recurring commission**.

### How It Works

```
You share your affiliate link
    │
    ▼
Someone clicks it and signs up
    │
    ▼
They become YOUR referred user (tagged permanently)
    │
    ▼
Every time they spend credits on ANY tool...
    │
    ▼
You earn 10% of their spend as commission
    │
    ▼
Forever. As long as they're active on Sotally.
```

### Commission Structure

| Affiliate Tier | Requirement | Commission Rate | Cookie Duration |
|---------------|-------------|-----------------|-----------------|
| Standard | Sign up | 10% of referred users' spend | 90 days |
| Silver | 50+ referred active users | 12% | 90 days |
| Gold | 200+ referred active users | 15% | 120 days |
| Platinum | 500+ referred active users | 20% | 180 days |

**Cookie duration**: If someone clicks your link but signs up 60 days later, you still get credit (within cookie window).

**"Active user"**: A referred user who has spent credits in the last 30 days counts as active.

### Earnings Examples

| Scenario | Math | Monthly Earnings |
|----------|------|-----------------|
| 50 users spending avg 100 credits/mo | 50 × 100 × 10% × $0.083 | $41.50 |
| 200 users spending avg 200 credits/mo | 200 × 200 × 12% × $0.083 | $398.40 |
| 500 users spending avg 300 credits/mo | 500 × 300 × 15% × $0.083 | $1,867.50 |
| 1000 users spending avg 500 credits/mo | 1000 × 500 × 20% × $0.083 | $8,300.00 |

The more users you refer, the higher your tier, the more you earn per user.

---

## 8.2 Getting Started as an Affiliate

### Step 1: Sign Up

1. Go to **sotally.com/affiliates**
2. Click **"Join Affiliate Program"**
3. Fill in:
   - Name
   - Email
   - How you plan to promote (blog, YouTube, social media, email, ads)
   - Your website/channel URL (optional but helps approval)
4. Submit application
5. Approval within 24-48 hours (most are approved automatically)

### Step 2: Get Your Links

Once approved, your **Affiliate Dashboard** gives you:

```
Your unique affiliate link:
  sotally.com/?ref=jake123

Tool-specific links:
  sotally.com/tools/cold-email-writer?ref=jake123
  sotally.com/tools/seo-analyzer?ref=jake123

Category links:
  sotally.com/categories/marketing?ref=jake123
```

### Step 3: Promote

Share your links anywhere:
- Blog posts ("Best AI Tools for 2026")
- YouTube videos (link in description)
- Social media posts
- Email newsletters
- Paid ads (Google, Facebook — allowed with guidelines)
- Podcast mentions

### Step 4: Track & Earn

Watch your dashboard as referrals, signups, and earnings come in.

---

## 8.3 Affiliate Dashboard

### Overview Tab

```
┌─────────────────────────────────────────────────────────┐
│  AFFILIATE DASHBOARD                    Tier: Silver    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Clicks   │  │ Signups  │  │ Active   │  │Earnings│ │
│  │ Today    │  │ This Mo  │  │ Users    │  │This Mo │ │
│  │ 145      │  │ 23       │  │ 187      │  │$398.40 │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
│  Earnings Chart (last 30 days)                          │
│  ┌─────────────────────────────────────────────┐        │
│  │  $                                     ╱─   │        │
│  │  400 ─                              ╱──     │        │
│  │  300 ─                     ╱───────╱        │        │
│  │  200 ─           ╱────────╱                 │        │
│  │  100 ─  ╱───────╱                           │        │
│  │    0 ──╱────────────────────────────────     │        │
│  │       Week 1   Week 2   Week 3   Week 4     │        │
│  └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Referrals Tab

```
REFERRED USERS (187 active)

User       Signed Up    Credits Spent (All Time)   Your Commission
user_a     Jan 15       2,400 credits              $19.92
user_b     Jan 22       1,800 credits              $14.94
user_c     Feb 3        3,200 credits              $26.56
...

Filter: All | Active | Inactive | This Month | This Week
Sort by: Signup Date | Credits Spent | Commission Earned
```

### Links Tab

```
YOUR LINKS

Main link:     sotally.com/?ref=jake123          [Copy] [QR Code]
Landing page:  sotally.com/welcome?ref=jake123   [Copy] [QR Code]

Tool-specific links:
  Cold Email Writer    sotally.com/tools/cold-email-writer?ref=jake123     [Copy]
  SEO Analyzer         sotally.com/tools/seo-analyzer?ref=jake123          [Copy]
  + Generate link for any tool...

Link Performance:
  Link                    Clicks   Signups   Conv. Rate
  Main link               1,234    89        7.2%
  Cold Email Writer       456      34        7.5%
  SEO Analyzer           234       12        5.1%
```

### Marketing Materials Tab

```
MARKETING MATERIALS

Banners:
  [728x90 Leaderboard]  [300x250 Medium Rectangle]  [160x600 Skyscraper]

Social Cards:
  [Twitter/X Card]  [LinkedIn Card]  [Instagram Story]

Email Templates:
  [Introduction Email]  [Tool Spotlight Email]  [Monthly Roundup]

All materials include your affiliate link automatically.
[Download All as ZIP]
```

### Payouts Tab

```
EARNINGS BALANCE: $398.40

Payout History:
  Mar 1    $312.00    Completed    → Bank account ****4521
  Feb 1    $287.00    Completed    → Bank account ****4521
  Jan 1    $198.00    Completed    → Bank account ****4521

  [ Request Payout ]     Minimum: $25

Payout method: Stripe Connect (Bank Transfer)
[Update payout method]
```

---

## 8.4 Affiliate Rules & Guidelines

### What's Allowed

- Promote on your own channels (blog, YouTube, social, email, podcast)
- Run paid ads (Google, Facebook, etc.) — but don't bid on "Sotally" brand keywords
- Create honest reviews, tutorials, and comparisons
- Offer your own bonuses to people who sign up through your link (e.g., "Sign up via my link and I'll send you my email marketing guide")
- Deep-link to specific tools or categories

### What's NOT Allowed

- **Spam**: Mass unsolicited emails, spam comments, or DMs
- **Misleading claims**: "Get rich quick", "Guaranteed income", "Free money"
- **Brand bidding**: Running ads on "Sotally" or trademark keywords
- **Cookie stuffing**: Forcing affiliate cookies without user knowledge
- **Self-referral**: Referring your own accounts
- **Incentivized signups**: Paying people to sign up (their spend won't be genuine)

### Violations

| Severity | Action |
|----------|--------|
| Minor (accidental guideline violation) | Warning + guidance |
| Moderate (misleading promotion) | Commission hold + corrective action required |
| Severe (spam, cookie stuffing) | Immediate termination + commission forfeiture |

---

## 8.5 Affiliate Notifications

| Event | In-App | Email |
|-------|--------|-------|
| Application approved | Yes | Yes |
| New referral signup | Yes | No |
| Referral milestone (10, 50, 100, 500) | Yes | Yes |
| Commission earned (daily summary) | Yes | No |
| Tier upgrade (Silver, Gold, Platinum) | Yes | Yes |
| Payout processed | Yes | Yes |
| Weekly performance digest | No | Yes |

---

# 9. Creator Storefronts & Distribution

## 9.1 Your Own Software Store

Every creator gets a **branded storefront** — your own website for your tools.

**Default**: `{username}.sotools.com` (free, automatic)
**Custom domain**: Point your own domain (e.g., `sarahmitchell.com`) via DNS CNAME

### What Your Storefront Includes

- Your brand (name, logo, colors, bio)
- All your published tools in a grid
- About page
- Testimonials from users
- Contact information
- Custom sections (text, CTAs, featured tools)
- Responsive design (works on mobile)
- SEO (your storefront ranks on Google)

### Setting Up Your Storefront

1. Go to **Creator Studio → Storefront**
2. Choose your subdomain: `yourname.sotools.com`
3. Customize branding (upload logo, pick colors)
4. Arrange your tools (drag to reorder, feature favorites)
5. Add an About section
6. Click **Publish**

### Custom Domain Setup

1. Go to **Creator Studio → Storefront → Custom Domain**
2. Enter your domain: `yourwebsite.com`
3. Follow DNS instructions:
   ```
   Add CNAME record:
   Host: @  (or www)
   Value: custom.sotools.com
   ```
4. Click **Verify Domain**
5. Once verified, SSL certificate auto-provisioned (1-2 minutes)
6. Your domain now serves your storefront

**Cost**: Free from Sotally. You only pay for your domain (~$12/year from any registrar).

---

## 9.2 Multi-Channel Tool Access

Every tool you create is automatically accessible through multiple channels. You build once — Sotally distributes everywhere.

### Access Channels

| Channel | How it works | Available |
|---------|-------------|-----------|
| **Web Marketplace** | Users find and run on sotally.com | Launch |
| **Creator Storefront** | Users find and run on your subdomain/domain | Launch |
| **REST API** | Developers call tools programmatically | Launch |
| **MCP (AI Agents)** | Claude, ChatGPT, and AI agents discover and use tools | Month 2 |
| **Embeddable Widget** | Embed tool on any website via `<script>` tag | Launch |
| **Mobile PWA** | Run tools from phone home screen | Month 2 |
| **Slack/Discord Bot** | Run tools from chat with `/sotally run` | Month 4 |
| **Zapier/Make** | Use tools as automation actions | Month 4 |
| **CLI** | Run tools from terminal | Month 4 |
| **Webhooks** | Get notified when tool execution completes | Month 4 |

### API Access

Every published tool has an API endpoint:

```
POST https://api.sotally.com/v1/tools/{slug}/execute
Authorization: Bearer {your_api_token}
Content-Type: application/json

{
  "input": {
    "company_name": "Acme Corp",
    "prospect_name": "Sarah",
    "tone": "professional"
  }
}
```

Response:
```json
{
  "execution_id": "exe_abc123",
  "status": "completed",
  "output": {
    "email": "Hi Sarah, I noticed Acme Corp..."
  },
  "credits_charged": 5,
  "duration_ms": 2340
}
```

Get your API token: **Dashboard → Settings → API Tokens → Create Token**

### MCP Access (AI Agents)

Your tools are automatically available to AI agents via MCP (Model Context Protocol):

1. User adds Sotally MCP server to their AI assistant (Claude Desktop, etc.)
2. User provides their Sotally API token
3. AI agent can now discover and execute ANY Sotally tool
4. User says: "Write me a cold email for Acme Corp" → Agent finds and runs your Cold Email Writer
5. Credits deducted from user's wallet, you earn your share

**You don't need to do anything** — every published tool is automatically MCP-compatible.

### Embeddable Widget

Embed any tool on your blog, website, or landing page:

```html
<script src="https://sotally.com/embed/cold-email-writer.js"></script>
```

This renders a compact tool form on your page. When someone runs it, they authenticate via popup and credits are deducted from their wallet. You earn your creator share.

**Use case**: Write a blog post about email marketing → embed your Email Subject Generator at the bottom → readers try it → become Sotally users → you earn from every run.

---

# 10. Notifications

Sotally sends notifications via **in-app** (bell icon) and **email**. Users control what they receive in Settings.

## 8.1 Buyer Notifications

| Event | In-App | Email | Description |
|-------|--------|-------|-------------|
| Welcome | Yes | Yes | "Welcome! You have 50 free credits" |
| Tool run complete | Yes | No | "Your result is ready" (for async tools >5s) |
| Tool run failed | Yes | Yes | "Tool failed — credits refunded" |
| Low credits | Yes | Yes | "You have 10 credits remaining" (threshold: 10) |
| Credits purchased | Yes | Yes | "275 credits added to your wallet" |
| Subscription renewed | Yes | Yes | "SEO Dashboard renewed — 50 credits deducted" |
| Subscription paused | Yes | Yes | "Subscription paused — insufficient credits" |
| New tool by followed creator | Yes | No | "Sarah published a new tool: Email Optimizer" |
| Weekly digest | No | Yes | "Your week on Sotally: 12 tools run, 45 credits spent" |

## 8.2 Creator Notifications

| Event | In-App | Email | Description |
|-------|--------|-------|-------------|
| Tool approved | Yes | Yes | "Your tool is live in the marketplace!" |
| Tool rejected | Yes | Yes | "Review feedback for your tool" + reasons |
| First run | Yes | Yes | "Someone used your tool for the first time!" |
| Milestone | Yes | Yes | "Your tool hit 100 / 500 / 1,000 / 10,000 runs!" |
| New review | Yes | No | "New 5-star review on Cold Email Writer" |
| Negative review | Yes | Yes | "New 2-star review — check feedback" |
| New subscriber | Yes | No | "New subscriber to your SEO Dashboard" |
| Earnings milestone | Yes | Yes | "You earned $100 / $500 / $1,000 this month!" |
| Payout processed | Yes | Yes | "$207.50 sent to your bank account" |
| Payout failed | Yes | Yes | "Payout failed — update your bank details" |
| Tool suspended | Yes | Yes | "Your tool has been suspended — action needed" |
| Weekly creator digest | No | Yes | "This week: 340 runs, $28.22 earned, avg 4.6 rating" |

## 8.3 Admin Notifications

| Event | In-App | Email | Description |
|-------|--------|-------|-------------|
| New tool pending review | Yes | No | "12 tools waiting for review" |
| New abuse report | Yes | Yes (urgent) | "Tool reported: spam" |
| Payout request | Yes | No | "Creator requested $500 payout" |
| High-value payout (>$1000) | Yes | Yes | "Large payout request — needs approval" |
| Platform alert | Yes | Yes | "Execution queue backed up" / "Error rate spike" |

## 8.4 Notification Settings

Users can configure in **Settings → Notifications**:

```
Email Notifications
  [✓] Important (tool failures, payouts, account issues) — always on
  [✓] Milestones (runs, earnings achievements)
  [ ] Marketing (tips, featured tools, platform updates)
  [✓] Weekly digest

In-App Notifications
  [✓] All notifications (shown in bell icon)
```

Simple toggle controls. Critical notifications (failures, suspensions, security) cannot be turned off.

---

# 11. Policies & Terms

## 11.1 Acceptable Use Policy

### What's Allowed

Sotally welcomes any tool that provides genuine value to users, including:
- AI-powered generators, analyzers, and assistants
- Data processing and transformation tools
- Productivity and business utilities
- Developer tools and integrations
- Educational and research tools
- Creative and design tools
- Any legal software utility

### What's Prohibited

The following are NOT allowed on Sotally:

**Harmful Content**
- Tools that generate hate speech, harassment, or discrimination
- Tools that produce content sexualizing minors
- Tools that create deepfakes or non-consensual intimate imagery
- Tools that generate content inciting violence or terrorism

**Fraud & Deception**
- Tools designed to deceive (fake reviews, fake social proof, impersonation)
- Tools that facilitate phishing, scams, or financial fraud
- Tools that generate misleading academic content for plagiarism
- Tools making unverifiable medical, legal, or financial claims as fact

**Security & Privacy**
- Tools that harvest personal data without clear, legitimate need
- Tools that attempt to extract other users' API keys or credentials
- Tools that attack, exploit, or probe other systems
- Tools that bypass security measures or DRM

**Intellectual Property**
- Tools that directly copy another creator's tool without permission
- Tools that impersonate other services ("Unofficial [Brand] Tool")
- Tools that systematically scrape copyrighted content

**Spam & Abuse**
- Bulk-created low-effort tools (spam tools)
- Tools with clickbait descriptions that don't match functionality
- Tools created solely to drain users' credits without providing value

### Enforcement

| Violation Severity | First Offense | Second Offense | Third Offense |
|-------------------|---------------|----------------|---------------|
| Minor (misleading description, wrong category) | Warning + fix request | Tool suspended | Creator suspended 30 days |
| Moderate (low quality, pricing abuse) | Tool suspended | Creator suspended 30 days | Creator banned |
| Severe (fraud, data harvesting) | Creator suspended immediately | Creator banned | — |
| Critical (illegal content, CSAM) | Immediate ban + report to authorities | — | — |

---

## 11.2 Content Policy

### Tool Descriptions

Tool descriptions must:
- Accurately describe what the tool does
- Not make unverifiable claims ("guaranteed", "100% accurate")
- Not use excessive capitalization or symbols for attention
- Not include contact info or links to external payment (use Sotally's system)
- Be written in clear language (primary: English, with localization support coming)

### Tool Output

Creators are responsible for their tools' output. Tools must:
- Include disclaimers where appropriate (e.g., "This is AI-generated, not legal advice")
- Not produce output that violates applicable laws
- Not systematically produce offensive or harmful content
- Handle edge cases gracefully (don't crash or produce garbage on unusual inputs)

### Reviews

Reviews must:
- Be genuine (written by users who actually ran the tool)
- Describe the actual experience
- Not contain personal attacks, harassment, or spam
- Not be incentivized (creators cannot offer payment for reviews)

Fake reviews (positive or negative) will be removed and may result in account action.

---

## 11.3 Creator Terms

### Intellectual Property

- **You own your tools.** The prompts, logic, and configurations you create are your intellectual property.
- **You grant Sotally a license** to execute, display, promote, and cache your tool as needed for the platform to function.
- **Your prompts are protected.** They are encrypted and never shown to users.
- **Sotally does not claim ownership** of your tool's outputs.

### Revenue & Payouts

- Revenue share is based on your Creator Level (65-80% to creator)
- Earnings accumulate in your Creator Earnings Wallet
- Minimum payout: $50 equivalent in credits
- Payout processing: 1-3 business days via Stripe Connect
- Sotally reserves the right to withhold payouts for suspected fraud (pending investigation, max 30 days)
- Revenue share rates may change with 30 days' notice

### Creator Obligations

- Keep your tools functional and maintained
- Respond to user feedback and reports in a timely manner
- Not manipulate the marketplace (fake reviews, self-dealing, spam)
- Comply with the Acceptable Use Policy
- Ensure your tools don't violate third-party rights

### Tool Lifecycle

- **Draft**: Being built, not visible to users
- **Pending Review**: Submitted, awaiting moderator approval
- **Active**: Live in the marketplace
- **Suspended**: Temporarily removed (policy violation or quality issue)
- **Archived**: Voluntarily removed by creator or auto-archived after 12 months of inactivity with <10 runs

Archived tools can be reactivated by the creator at any time.

### Termination

- You can delete your account and tools at any time
- Outstanding earnings will be paid out within 30 days of account closure
- Sotally may terminate creator accounts for repeated policy violations
- Upon termination: active subscriptions are cancelled, users are refunded for unused subscription periods

---

## 11.4 Refund Policy

### Automatic Refunds

| Scenario | Refund | Automatic? |
|----------|--------|------------|
| Tool execution fails (error, timeout) | Full credit refund | Yes |
| Tool produces empty/no output | Full credit refund | Yes |
| Subscription renewal fails (insufficient credits) | No charge, subscription pauses | Yes |

### Buyer-Requested Refunds

| Scenario | Refund | Process |
|----------|--------|---------|
| Unused credits (within 30 days of purchase) | Full USD refund | Contact support |
| Unused credits (after 30 days) | No refund (credits don't expire, keep using them) | — |
| Tool output was low quality | Credit refund at support's discretion | Report tool, support reviews |
| Tool was misleading (description doesn't match) | Full credit refund + tool flagged | Report tool |
| Subscription (cancel mid-period) | No refund for current period, access continues until period ends | Cancel in dashboard |
| Accidental purchase | Full USD refund if no credits used, within 24 hours | Contact support |

### Disputes

If you disagree with a refund decision:
1. Reply to the support email with your explanation
2. A senior support agent will review within 48 hours
3. If still unresolved, escalate to admin review
4. Final decisions are made within 7 business days

### Chargeback Policy

If you file a credit card chargeback:
- Your account will be suspended pending investigation
- If the chargeback is upheld: your credit balance will be reduced accordingly
- If your credit balance is insufficient: your account remains suspended until resolved
- Repeated chargebacks may result in permanent account closure

---

## 11.5 Privacy & Data Handling

### What Data We Collect

| Data Type | What | Retention | Who Can Access |
|-----------|------|-----------|---------------|
| Account info | Email, name, avatar | Until account deletion | You, support, admin |
| Execution inputs | What you entered to run tools | 90 days | You, tool creator (anonymized), support |
| Execution outputs | Tool results | 90 days | You, support |
| Credit transactions | Purchase and spend history | Indefinite (financial records) | You, support, admin |
| Creator prompts | Tool logic and configurations | Until tool deleted | Creator only (encrypted) |
| BYOM API keys | Your external API keys | Until you delete them | Never exposed (AES-256 encrypted) |
| Usage analytics | Aggregated tool usage patterns | Indefinite (anonymized) | Admin, creators (anonymized) |

### Data Protection

- **Encryption**: All sensitive data encrypted at rest (AES-256) and in transit (TLS 1.3)
- **API Keys**: BYOM keys are encrypted with AES-256-GCM, decrypted only at execution time, never logged
- **Execution isolation**: Tool executions are sandboxed — one tool cannot access another tool's data
- **No data selling**: We never sell user data to third parties
- **Anonymization**: Creator analytics show aggregated data only (no individual user details)

### Your Rights

- **Access**: Download all your data (account, execution history, transactions)
- **Deletion**: Delete your account and all associated data (30-day processing period)
- **Portability**: Export your tool configurations
- **Opt-out**: Opt out of marketing communications at any time
- **API key management**: Delete your stored API keys at any time

### Data Breach Response

In the event of a data breach:
1. We will notify affected users within 72 hours
2. We will provide details: what data was affected, what we're doing about it
3. We will report to relevant authorities as required by law
4. We will offer credit monitoring if personal data was exposed

---

## 11.6 DMCA & Intellectual Property

### If Your Tool Was Copied

If you believe another creator has copied your tool:

1. **File a report**: Go to the tool's page → Click "Report" → Select "Plagiarism"
2. **Provide evidence**: Include your tool's URL, when you published it, and specific similarities
3. **Review**: Our moderation team will compare both tools within 5 business days
4. **Resolution**: If plagiarism is confirmed, the copied tool is removed and the creator is warned

### DMCA Takedown Process

If you believe a tool infringes your copyright:

1. Send a DMCA notice to legal@sotally.com with:
   - Your contact information
   - Description of the copyrighted work
   - URL of the infringing tool on Sotally
   - Statement of good faith belief
   - Statement under penalty of perjury
   - Your signature
2. We will remove or disable access to the tool within 48 hours
3. We will notify the tool's creator
4. The creator may file a counter-notice
5. If no counter-notice: tool remains removed
6. If counter-notice: you have 14 days to file a court action, otherwise tool is restored

### Counter-Notice

If your tool was removed due to a DMCA notice and you believe it was incorrect:
1. Send a counter-notice to legal@sotally.com
2. Include your contact info, identify the removed tool, and state under penalty of perjury that removal was a mistake
3. The complaining party has 14 days to file court action
4. If no court action: your tool will be restored

---

*Last updated: March 2026*
*Sotally — Your Software Ally*
