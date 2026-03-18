# Sotally V2 — API Reference

```
Base URL:     https://sotally.com/api
Version:      2.0.0
Last Updated: 2026-03-18
```

---

## Authentication

Sotally uses two authentication methods:

| Method | Header | Used By |
|--------|--------|---------|
| **Session (JWT)** | `Cookie` (managed by NextAuth) | Web app, browser sessions |
| **API Key** | `Authorization: Bearer sk-xxx` | API v1 endpoints (Business tier) |

All endpoints below are prefixed with `/api` (stripped by Caddy reverse proxy, so the Hono API receives requests without the `/api` prefix).

### Response Format

Every endpoint returns a consistent JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

On error:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

Common error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`.

---

## Apps

### POST /apps/generate

Create a new app from a prompt. Queues a generation job and returns immediately.

- **Auth**: Session (JWT)
- **Status**: 202 Accepted

**Request Body:**
```json
{
  "prompt": "A pomodoro timer with customizable intervals",
  "niche": "Productivity"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `prompt` | string | Yes | 1-2000 chars |
| `niche` | string | No | Max 100 chars |

**Response:**
```json
{
  "success": true,
  "data": {
    "appId": "uuid",
    "generationId": "uuid"
  }
}
```

---

### POST /apps/:id/iterate

Iterate on an existing app by describing changes.

- **Auth**: Session (JWT) — must own the app
- **Status**: 202 Accepted

**Request Body:**
```json
{
  "prompt": "Add dark mode and a settings panel"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `prompt` | string | Yes | 1-2000 chars |

**Response:**
```json
{
  "success": true,
  "data": {
    "generationId": "uuid"
  }
}
```

Returns 400 if no existing source (App.tsx) is found to iterate on.

---

### POST /apps/:id/publish

Publish an app to your storefront.

- **Auth**: Session (JWT) — must own the app
- **Status**: 200

The app must have at least one built version. Returns 400 if already published or no version exists.

**Response:**
```json
{
  "success": true,
  "data": { "id": "uuid", "status": "published", "publishedAt": "..." }
}
```

---

### GET /apps/my

List the authenticated user's apps (all statuses).

- **Auth**: Session (JWT)
- **Status**: 200

**Response:** Array of app objects with `id`, `slug`, `name`, `description`, `iconUrl`, `status`, `niche`, `totalSessions`, `totalUsers`, `likeCount`, `generationCount`, `publishedAt`, `createdAt`, `updatedAt`.

---

### GET /apps/by-creator

List published apps by a creator's storefront slug.

- **Auth**: None (public)
- **Status**: 200

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `slug` | Yes | Creator's storefront slug |

**Response:** Array of published app objects with creator info.

---

### GET /apps/by-slug

Look up a specific app by creator slug + app slug.

- **Auth**: None (public, optional auth)
- **Status**: 200

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `creator` | Yes | Creator's storefront slug |
| `slug` | Yes | App's slug |

**Response:** Full app detail including `bundleUrl` and `creator` object. Returns 404 if app is not published or unlisted.

---

### GET /apps/explore

Browse published apps, optionally filtered by niche.

- **Auth**: None (public)
- **Status**: 200

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `niche` | — | Filter by niche |
| `limit` | 50 | Max 100 |
| `offset` | 0 | Pagination offset |

**Response:** Array of app objects enriched with `creator` info.

---

### GET /apps/featured

List featured published apps.

- **Auth**: None (public)
- **Status**: 200

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | 12 | Max 50 |

**Response:** Array of featured app objects with `creator` info.

---

### GET /apps/niche-counts

Get count of published apps per niche.

- **Auth**: None (public)
- **Status**: 200

**Response:**
```json
{
  "success": true,
  "data": {
    "Productivity": 42,
    "Finance": 18,
    "Health": 12
  }
}
```

---

### GET /apps/search

Full-text search across published apps (name, description, original prompt). Uses PostgreSQL `tsvector` with weighted ranking.

- **Auth**: None (public)
- **Status**: 200

**Query Parameters:**

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `q` | Yes | — | Search query |
| `niche` | No | — | Filter by niche |
| `limit` | No | 20 | Max 50 |
| `offset` | No | 0 | Pagination offset |

**Response:** Array of app objects ranked by relevance, enriched with `creator` info.

---

### GET /apps/:id

Get full app details by ID.

- **Auth**: Optional (public for published apps)
- **Status**: 200

**Response:** Full app detail including `bundleUrl` and `creator` object.

---

### GET /apps/:id/bundle

Redirect to the app's compiled bundle URL.

- **Auth**: None (public)
- **Status**: 302 Redirect
- **Cache**: `public, max-age=3600, immutable`

Returns 404 if no bundle is available.

---

### GET /apps/:id/status

Poll generation status for an app.

- **Auth**: Session (JWT) — must own the app
- **Status**: 200

**Response:**
```json
{
  "success": true,
  "data": {
    "appStatus": "generating",
    "generation": {
      "id": "uuid",
      "type": "initial",
      "status": "running",
      "errorMessage": null,
      "queuedAt": "...",
      "startedAt": "...",
      "completedAt": null,
      "durationMs": null
    }
  }
}
```

---

### GET /apps/:id/generations

Get full generation history for an app.

- **Auth**: Session (JWT) — must own the app
- **Status**: 200

**Response:** Array of generation records including `type`, `prompt`, `status`, `model`, token counts, timing, and error info.

---

## Storefront

### GET /storefront/profile

Get a creator's public storefront profile.

- **Auth**: None (public)
- **Status**: 200

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `slug` | Yes | Creator's storefront slug |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "bio": "I build productivity tools",
    "avatarUrl": "https://...",
    "bannerUrl": "https://...",
    "niche": "Productivity",
    "followerCount": 42,
    "appCount": 7,
    "createdAt": "..."
  }
}
```

---

### GET /storefront/check-slug

Check if a storefront slug is available.

- **Auth**: Session (JWT)
- **Status**: 200

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `slug` | Yes | Slug to check |

**Response:**
```json
{
  "success": true,
  "data": { "available": true }
}
```

---

### POST /storefront/setup

Initial storefront setup during onboarding. Sets the slug and marks onboarding as complete.

- **Auth**: Session (JWT)
- **Status**: 200

**Request Body:**
```json
{
  "slug": "janedoe",
  "bio": "I build productivity tools",
  "niche": "Productivity",
  "displayName": "Jane Doe"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `slug` | string | Yes | 3-30 chars, lowercase alphanumeric + hyphens |
| `bio` | string | No | Max 500 chars |
| `niche` | string | No | Max 100 chars |
| `displayName` | string | No | Max 255 chars |

Returns 409 if slug is reserved or taken.

---

### PATCH /storefront/profile

Update storefront profile fields.

- **Auth**: Session (JWT)
- **Status**: 200

**Request Body (all fields optional):**
```json
{
  "bio": "Updated bio",
  "niche": "Finance",
  "websiteUrl": "https://janedoe.com",
  "socialLinks": { "twitter": "@janedoe", "github": "janedoe" },
  "bannerUrl": "https://..."
}
```

---

## App Data

Key-value storage for apps. Apps can persist user-specific or anonymous data.

### GET /app-data/apps/:appId/data

Read a stored value.

- **Auth**: Optional (supports anonymous access)
- **Status**: 200

**Query Parameters:**

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `key` | Yes | — | Data key |
| `namespace` | No | `default` | Namespace for key isolation |

**Response:**
```json
{
  "success": true,
  "data": {
    "value": { "score": 42 },
    "updatedAt": "..."
  }
}
```

---

### PUT /app-data/apps/:appId/data

Create or update a stored value.

- **Auth**: Optional
- **Status**: 200

**Request Body:**
```json
{
  "key": "settings",
  "namespace": "default",
  "value": { "theme": "dark", "fontSize": 16 }
}
```

Maximum value size: 100KB.

---

### DELETE /app-data/apps/:appId/data

Delete a stored value.

- **Auth**: Optional
- **Status**: 200

**Query Parameters:** `key`, `namespace` (same as GET).

---

### GET /app-data/apps/:appId/data/list

List all keys in a namespace for the current user.

- **Auth**: Optional
- **Status**: 200

**Query Parameters:**

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `namespace` | No | `default` | Namespace to list |

---

## Social

All social endpoints require authentication.

### POST /social/follow/:creatorId

Follow a creator.

- **Auth**: Session (JWT)
- **Status**: 201

Returns 400 if trying to follow yourself. Returns 409 if already following.

---

### DELETE /social/follow/:creatorId

Unfollow a creator.

- **Auth**: Session (JWT)
- **Status**: 200

Returns 404 if not following.

---

### GET /social/following

List creators the authenticated user follows.

- **Auth**: Session (JWT)
- **Status**: 200

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | 50 | Max 100 |
| `offset` | 0 | Pagination offset |

**Response:** Array of creator profiles with `followedAt`.

---

### POST /social/like/:appId

Like a published app.

- **Auth**: Session (JWT)
- **Status**: 201

Returns 409 if already liked.

---

### DELETE /social/like/:appId

Unlike an app.

- **Auth**: Session (JWT)
- **Status**: 200

---

### GET /social/feed

Activity feed showing recent published apps from followed creators.

- **Auth**: Session (JWT)
- **Status**: 200

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | 20 | Max 50 |
| `offset` | 0 | Pagination offset |

**Response:** Array of app objects enriched with `creator` info and `liked` boolean.

---

### POST /social/share/:appId

Get a shareable URL for an app.

- **Auth**: Session (JWT)
- **Status**: 200

**Response:**
```json
{
  "success": true,
  "data": {
    "shareUrl": "https://sotally.com/janedoe/pomodoro-timer",
    "appName": "Pomodoro Timer"
  }
}
```

---

## Billing

### POST /billing/checkout

Create a Stripe Checkout session for a one-time app purchase.

- **Auth**: Session (JWT)
- **Status**: 200

**Request Body:**
```json
{
  "appId": "uuid"
}
```

Returns 400 if app is free, not published, has no price, or is already purchased. Uses Stripe Connect destination charges when the creator has connected their Stripe account (85% to creator, 15% platform fee).

**Response:**
```json
{
  "success": true,
  "data": { "url": "https://checkout.stripe.com/..." }
}
```

---

### POST /billing/subscribe

Create a Stripe Checkout session for a platform subscription.

- **Auth**: Session (JWT)
- **Status**: 200

**Request Body:**
```json
{
  "tier": "pro"
}
```

| Tier | Monthly Price |
|------|---------------|
| `pro` | $19 |
| `business` | $49 |

Returns 400 if already on the requested tier.

**Response:**
```json
{
  "success": true,
  "data": { "url": "https://checkout.stripe.com/..." }
}
```

---

### GET /billing/purchases

List the authenticated user's purchased apps.

- **Auth**: Session (JWT)
- **Status**: 200

**Response:** Array of purchase records with app details.

---

### POST /billing/connect/onboard

Start Stripe Connect Express onboarding for the creator.

- **Auth**: Session (JWT)
- **Status**: 200

Creates a new Stripe Connect account if one doesn't exist, then returns an onboarding URL.

**Response:**
```json
{
  "success": true,
  "data": { "url": "https://connect.stripe.com/..." }
}
```

---

### GET /billing/connect/status

Check the creator's Stripe Connect onboarding status.

- **Auth**: Session (JWT)
- **Status**: 200

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "detailsSubmitted": true
  }
}
```

---

## Templates

### POST /templates

Save an existing app as a reusable template.

- **Auth**: Session (JWT) — must own the app
- **Status**: 201

**Request Body:**
```json
{
  "appId": "uuid",
  "title": "Pomodoro Timer Template",
  "description": "A customizable timer with work/break intervals",
  "niche": "Productivity",
  "priceCents": 499
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `appId` | string (UUID) | Yes | Must own the app |
| `title` | string | Yes | 1-255 chars |
| `description` | string | No | Max 1000 chars |
| `niche` | string | No | Max 100 chars |
| `priceCents` | number | No | Default 0 (free) |

The template captures the full prompt chain (all successful generation prompts).

---

### GET /templates

Browse available templates.

- **Auth**: None (public)
- **Status**: 200

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `niche` | — | Filter by niche |
| `limit` | 50 | Max 100 |
| `offset` | 0 | Pagination offset |

Sorted by use count (descending), then creation date.

---

### GET /templates/:id

Get template detail including prompt chain.

- **Auth**: None (public)
- **Status**: 200

---

### POST /templates/:id/use

Clone a template to create a new app in your account.

- **Auth**: Session (JWT)
- **Status**: 202

Generates a new app using the template's initial prompt. Increments the template's use count.

**Response:**
```json
{
  "success": true,
  "data": {
    "appId": "uuid",
    "generationId": "uuid"
  }
}
```

---

## API v1 (Business Tier)

All API v1 endpoints require API key authentication. These are designed for programmatic access.

### Authentication

```
Authorization: Bearer sk-your-api-key-here
```

API keys start with `sk-`. They are validated by SHA-256 hash lookup. Expired keys return 401.

---

### GET /api/v1/apps

List the authenticated creator's apps.

- **Auth**: API Key
- **Status**: 200

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `status` | — | Filter by status (generating, draft, published, etc.) |
| `limit` | 50 | Max 100 |
| `offset` | 0 | Pagination offset |

---

### POST /api/v1/apps

Create a new app from a prompt.

- **Auth**: API Key
- **Status**: 202

**Request Body:**
```json
{
  "prompt": "A habit tracker with weekly heatmap",
  "niche": "Productivity",
  "name": "Habit Heatmap"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `prompt` | string | Yes | 1-2000 chars |
| `niche` | string | No | Max 100 chars |
| `name` | string | No | Max 255 chars (auto-generated from prompt if omitted) |

---

### GET /api/v1/apps/:id

Get app details (must own the app).

- **Auth**: API Key
- **Status**: 200

Returns full app detail including `bundleUrl`.

---

### PATCH /api/v1/apps/:id

Update an app. If `prompt` is provided, triggers an iteration (202). Otherwise updates metadata fields (200).

- **Auth**: API Key
- **Status**: 202 (iteration) or 200 (metadata update)

**Request Body (all optional):**
```json
{
  "prompt": "Add export to PDF",
  "name": "Updated Name",
  "description": "New description",
  "niche": "Finance"
}
```

---

### POST /api/v1/apps/:id/publish

Publish an app.

- **Auth**: API Key
- **Status**: 200

Returns 400 if already published or no built version exists.

---

## Notifications

### GET /notifications

List the authenticated user's notifications, paginated.

- **Auth**: Session (JWT)
- **Status**: 200

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | 20 | Max 50 |
| `offset` | 0 | Pagination offset |

**Response includes** `total` count and `unread` count alongside the notification items.

---

### PATCH /notifications/:id/read

Mark a single notification as read.

- **Auth**: Session (JWT)
- **Status**: 200

---

### POST /notifications/read-all

Mark all notifications as read.

- **Auth**: Session (JWT)
- **Status**: 200

---

## Custom Domains

### POST /domains

Add a custom domain to your storefront.

- **Auth**: Session (JWT)
- **Status**: 201

**Request Body:**
```json
{
  "domain": "apps.yourbrand.com"
}
```

**Response includes DNS instructions:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "domain": "apps.yourbrand.com",
    "verified": false,
    "verification": {
      "type": "CNAME",
      "host": "apps.yourbrand.com",
      "value": "storefront.sotally.com",
      "txtRecord": {
        "host": "_sotally.apps.yourbrand.com",
        "value": "sotally-verify-abc123..."
      },
      "instructions": "Add a CNAME record pointing apps.yourbrand.com to storefront.sotally.com..."
    }
  }
}
```

Returns 409 if domain is already registered.

---

### GET /domains

List the authenticated creator's custom domains.

- **Auth**: Session (JWT)
- **Status**: 200

Each domain includes a `status` field: `active` or `pending`.

---

### DELETE /domains/:id

Remove a custom domain.

- **Auth**: Session (JWT) — must own the domain
- **Status**: 200

---

### GET /domains/verify/:id

Trigger DNS verification for a domain. Performs a CNAME lookup to check if the domain points to `sotally.com`.

- **Auth**: Session (JWT) — must own the domain
- **Status**: 200

If verification succeeds, marks the domain as verified and returns `status: "active"`. Otherwise returns `status: "pending"` with setup instructions.

---

## Health

### GET /health

Basic health check.

- **Auth**: None
- **Status**: 200

---

## Server-Sent Events

### GET /stream/:generationId

Stream generation progress in real-time (SSE).

- **Auth**: Session (JWT)
- **Status**: 200 (text/event-stream)

Use this instead of polling `/apps/:id/status` for a real-time generation experience.
