# Sotally User Manual — V2

> Your Software Ally. Describe it, generate it, publish it.

---

## Table of Contents

1. [What is Sotally?](#1-what-is-sotally)
2. [Getting Started](#2-getting-started)
3. [Creating Your First App](#3-creating-your-first-app)
4. [Your Storefront](#4-your-storefront)
5. [Monetization](#5-monetization)
6. [Social Features](#6-social-features)
7. [Templates](#7-templates)
8. [API Access (Business Tier)](#8-api-access-business-tier)
9. [Custom Domains (Pro/Business)](#9-custom-domains-probusiness)
10. [FAQ](#10-faq)

---

## 1. What is Sotally?

Sotally is a platform where anyone creates software apps by describing them in plain English. You type what you want, AI generates it, and it gets deployed to your personal storefront.

Think of it as **Shopify for software creation** — you don't need to code, design, or deploy anything. Describe your idea, and Sotally builds a working web application for you.

### How It Works

```
1. You describe an app in plain English
2. AI generates a working web application (~30 seconds)
3. You preview, iterate, and refine it
4. You publish it to your storefront
5. Anyone can find and use your app
6. You earn money when people pay for it
```

### Who Is It For?

- **Creators** — People with ideas who want to build and sell software without coding
- **Entrepreneurs** — Launch micro-SaaS products in minutes instead of months
- **Professionals** — Build internal tools, calculators, dashboards for your niche
- **Developers** — Rapidly prototype ideas and deploy via API

---

## 2. Getting Started

### Sign Up

1. Go to [sotally.com](https://sotally.com)
2. Click **Sign Up**
3. Register with your email or sign in with Google OAuth
4. You'll be taken to the onboarding flow

### Claim Your Subdomain

During onboarding, you'll claim your unique storefront URL:

```
https://yourname.sotally.com
```

Rules for your subdomain slug:
- 3-30 characters
- Lowercase letters, numbers, and hyphens only
- Cannot start or end with a hyphen
- Cannot use reserved words (admin, api, app, www, help, support, etc.)

### Set Up Your Profile

Complete your profile during onboarding:

| Field | Description | Required |
|-------|-------------|----------|
| **Display Name** | Your name as shown to visitors | Yes |
| **Subdomain** | Your storefront URL slug | Yes |
| **Bio** | Short description of what you do (up to 500 chars) | No |
| **Niche** | Your primary focus area (up to 100 chars) | No |
| **Avatar** | Your profile picture | No |

Once onboarding is complete, you can update your profile anytime from the dashboard.

---

## 3. Creating Your First App

### Step 1 — Go to /create

From your dashboard, click **Create New App** or navigate to `/create`.

### Step 2 — Describe Your App

Write a plain English description of what you want. Be as specific as you can.

**Good prompts:**

- "A pomodoro timer with customizable work/break intervals, a progress ring animation, and a history log of completed sessions"
- "A BMI calculator that takes height and weight, shows BMI category with a color-coded gauge, and provides health recommendations"
- "A markdown editor with live preview, dark mode toggle, and export to HTML button"

**Less effective prompts:**

- "Make me an app" (too vague)
- "Calculator" (no detail on what kind)

### Step 3 — Select a Niche (Optional)

Choose a niche category for discoverability. This helps users find your app when browsing the explore page.

### Step 4 — Generate

Click **Generate** and wait approximately 30 seconds. You'll see a status indicator while the AI builds your app.

Behind the scenes:
- Your prompt is sent to the generation queue
- An AI model (configurable — Anthropic, OpenAI, or others) writes the app code
- The app is bundled and stored
- A preview becomes available in the studio

### Step 5 — Preview in the Studio

Once generation completes, your app appears in the studio where you can interact with it live.

### Step 6 — Iterate

Not quite right? Use the iterate feature to refine your app:

- "Add dark mode"
- "Change the chart to a bar chart"
- "Make the button larger and add a loading spinner"
- "Add a settings panel with font size control"

Each iteration builds on the current version, preserving your previous work. You can view your full generation history from the app detail page.

### Step 7 — Publish

When you're happy with your app, click **Publish**. Your app will be:

- Live on your storefront at `yourname.sotally.com`
- Discoverable on the Explore page
- Searchable by name, description, and original prompt
- Shareable via a direct URL

---

## 4. Your Storefront

### What Is It?

Your storefront is your public page at `yourname.sotally.com`. It's your software shop — a showcase of everything you've built.

### What Visitors See

- Your profile: name, avatar, bio, niche
- Your banner image (if set)
- All your published apps with descriptions, icons, and stats
- Follower count and total app count

### Customizing Your Storefront

From your dashboard, update your storefront profile:

| Field | Description |
|-------|-------------|
| **Bio** | Up to 500 characters describing you/your work |
| **Niche** | Your primary category |
| **Website URL** | Link to your personal website |
| **Social Links** | Key-value pairs (e.g., twitter: @handle) |
| **Banner URL** | A banner image URL for your storefront header |

---

## 5. Monetization

### Pricing Your Apps

When publishing, you can set your app's pricing model:

| Model | Description |
|-------|-------------|
| **Free** | Anyone can use it, no charge |
| **One-time purchase** | Buyer pays once, gets permanent access |
| **Subscription** | Recurring monthly payment (coming soon) |

Set your price in USD. The minimum for paid apps varies by tier.

### Revenue Share

Sotally takes a **15% platform fee**. You keep **85%** of every sale.

```
Buyer pays $10 for your app
├── $8.50 goes to you (via Stripe Connect)
└── $1.50 platform fee
```

### Connecting Stripe

To receive payouts:

1. Go to **Dashboard > Revenue**
2. Click **Connect with Stripe**
3. Complete Stripe Express onboarding (takes ~5 minutes)
4. Once approved, payments flow directly to your Stripe account

You can check your Connect status anytime — the dashboard shows whether charges and payouts are enabled.

### Platform Subscription Tiers

Your Sotally account has a plan tier that unlocks additional features:

| Feature | Free | Pro ($19/mo) | Business ($49/mo) |
|---------|------|-------------|-------------------|
| App creation | Unlimited | Unlimited | Unlimited |
| Published apps | Up to 5 | Unlimited | Unlimited |
| Custom domain | No | Yes | Yes |
| API access | No | No | Yes |
| Priority generation | No | Yes | Yes |

---

## 6. Social Features

### Follow Creators

Find creators you like and follow them. Their new apps will appear in your activity feed.

- Click **Follow** on any creator's storefront or profile
- Unfollow anytime
- See all creators you follow from your social dashboard

### Like Apps

Show appreciation for apps you enjoy. Likes help surface popular apps in discovery.

### Activity Feed

Your feed shows recently published apps from creators you follow. It's a personalized stream of new software from people you care about.

Each feed item shows:
- App name, description, and icon
- Creator info
- Session count, likes, and rating
- Whether you've already liked it

### Share Apps

Share any published app via a generated URL. The share URL resolves to the app's page on the creator's storefront:

```
https://creatorname.sotally.com/app-slug
```

---

## 7. Templates

### What Are Templates?

Templates let you save your app's generation recipe (the prompt chain used to build it) so others can create their own version.

### Saving as a Template

1. Go to your app's detail page
2. Click **Save as Template**
3. Set a title, description, niche, and price
4. Your template captures the full prompt chain — the initial prompt and all iteration prompts that produced the final app

### Using a Template

1. Browse templates on the Templates page (filterable by niche)
2. Click **Use Template** on any template
3. A new app is created in your account using the template's initial prompt
4. You can then iterate further to customize it

### Earning from Templates

Set a price on your template (in cents). When others use it, you earn from each use. Popular templates with high use counts rank higher in browse results.

---

## 8. API Access (Business Tier)

Business tier subscribers get programmatic API access to create and manage apps.

### Authentication

All API v1 requests require a Bearer token:

```
Authorization: Bearer sk-your-api-key-here
```

API keys are managed from your dashboard settings. Each key is hashed and stored securely. Keys can have expiration dates.

### What You Can Do via API

- **List your apps** — Filter by status, paginate results
- **Create an app** — Send a prompt, get back an app ID and generation ID
- **Get app details** — Fetch full app info including bundle URL
- **Iterate on an app** — Send a new prompt to modify an existing app
- **Update metadata** — Change name, description, niche
- **Publish an app** — Make it live on your storefront

### Example: Create an App

```bash
curl -X POST https://sotally.com/api/v1/apps \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A habit tracker with weekly heatmap visualization",
    "niche": "Productivity",
    "name": "Habit Heatmap"
  }'
```

Response (202):
```json
{
  "success": true,
  "data": {
    "appId": "uuid",
    "generationId": "uuid",
    "status": "generating"
  },
  "error": null
}
```

See the [API Reference](./API_REFERENCE.md) for complete endpoint documentation.

---

## 9. Custom Domains (Pro/Business)

Pro and Business subscribers can map their own domain to their Sotally storefront.

### Setup Steps

1. Go to **Dashboard > Settings > Domains**
2. Enter your domain (e.g., `apps.yourbrand.com`)
3. You'll receive DNS instructions:
   - Add a **CNAME record** pointing your domain to `storefront.sotally.com`
   - Add a **TXT record** at `_sotally.yourdomain.com` for verification
4. Click **Verify** — Sotally checks your DNS records
5. Once verified, SSL is automatically provisioned via Caddy's on-demand TLS

### Managing Domains

- View all your domains and their status (pending / active)
- Remove domains you no longer need
- Re-verify if DNS changes caused issues

---

## 10. FAQ

### General

**Q: Do I need to know how to code?**
A: No. You describe what you want in plain English, and AI generates the app for you.

**Q: What kind of apps can I create?**
A: Any single-page web application — calculators, dashboards, games, tools, trackers, editors, and more. Apps are client-side React applications compiled with Babel standalone.

**Q: How long does generation take?**
A: Typically 15-45 seconds depending on complexity and current queue depth.

**Q: Can I edit the generated code directly?**
A: Not in V2's current UI. You iterate by describing changes in plain English. Developers with API access can inspect the generated source.

### Storefront

**Q: Can I have multiple storefronts?**
A: No, one storefront per account. But you can publish unlimited apps (on Pro/Business).

**Q: What if someone already took my desired slug?**
A: Slugs are first-come-first-served. Try variations or use a custom domain instead.

### Monetization

**Q: When do I get paid?**
A: Payments flow through Stripe Connect. Stripe handles payouts to your bank account on their standard schedule (typically 2-3 business days after a sale).

**Q: Is there a minimum payout?**
A: Stripe's standard minimums apply. There's no additional Sotally minimum.

**Q: What payment methods do buyers use?**
A: Credit/debit cards via Stripe Checkout. Apple Pay and Google Pay are supported where available.

### Technical

**Q: What tech stack do generated apps use?**
A: React with Babel standalone compilation. Apps are single-file bundles served from S3-compatible storage (MinIO).

**Q: Can my app store data?**
A: Yes. Apps can use the App Data API to persist key-value data per user (or anonymously). Up to 100KB per value.

**Q: Are apps mobile-responsive?**
A: That depends on the AI's generation. Including "mobile-responsive" in your prompt helps ensure it.

**Q: What AI models are used?**
A: Sotally supports multiple providers — Anthropic (Claude), OpenAI (GPT), Moonshot, and any OpenAI-compatible API. The specific model is configured by the platform operator.
