# Sotally -- Technical Specifications

```
Document:     TECHNICAL_SPEC.md
Version:      1.0.0
Last Updated: 2026-03-16
Status:       Draft
```

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema](#2-database-schema)
3. [API Specification](#3-api-specification)
4. [Tool Execution Engine](#4-tool-execution-engine)
5. [Security Specifications](#5-security-specifications)
6. [Performance Requirements](#6-performance-requirements)
7. [Infrastructure Spec](#7-infrastructure-spec)
8. [Data Flow Diagrams](#8-data-flow-diagrams)

---

## 1. System Architecture

### 1.1 Component Diagram

```
                          ┌─────────────────────────────────┐
                          │         Caddy (Reverse Proxy)    │
                          │   :443 TLS auto / :80 redirect   │
                          └──────────┬──────────┬───────────┘
                                     │          │
                          ┌──────────▼──┐  ┌────▼───────────┐
                          │  Next.js 15  │  │   Hono API     │
                          │  (Frontend)  │  │  (Backend)     │
                          │  :3000       │  │  :4000         │
                          └──────┬───────┘  └──┬──┬──┬──────┘
                                 │             │  │  │
                    ┌────────────┘    ┌────────┘  │  └────────┐
                    │                 │            │           │
              ┌─────▼─────┐   ┌──────▼──────┐  ┌─▼────┐  ┌──▼──────────┐
              │ NextAuth   │   │ PostgreSQL  │  │Redis │  │  BullMQ     │
              │ (JWT Auth) │   │ 16          │  │:6379 │  │  Workers    │
              │            │   │ :5432       │  │      │  │             │
              └────────────┘   └─────────────┘  └──────┘  └──┬──┬──────┘
                                                             │  │
                                                    ┌────────┘  └────────┐
                                                    │                    │
                                              ┌─────▼──────┐   ┌────────▼───────┐
                                              │  Docker     │   │  External API  │
                                              │  Sandbox    │   │  Proxy         │
                                              │  (Exec)     │   │  (Fetch)       │
                                              └─────────────┘   └────────────────┘
                                              
              ┌──────────────────────────────────────────────────────────┐
              │                    Stripe (External)                     │
              │  Checkout / Webhooks / Connect / Transfers               │
              └──────────────────────────────────────────────────────────┘
```

### 1.2 Service Communication Patterns

| From | To | Protocol | Pattern |
|------|----|----------|---------|
| Browser | Caddy | HTTPS | Request/Response |
| Caddy | Next.js | HTTP | Reverse proxy (path: `/*`) |
| Caddy | Hono API | HTTP | Reverse proxy (path: `/api/*`) |
| Next.js (SSR) | Hono API | HTTP | Internal fetch (localhost:4000) |
| Hono API | PostgreSQL | TCP | Connection pool (max 20) |
| Hono API | Redis | TCP | Persistent connection |
| Hono API | BullMQ | Redis | Job queue (pub/sub) |
| BullMQ Worker | Docker Daemon | Unix socket | Container lifecycle |
| BullMQ Worker | External APIs | HTTPS | Proxied fetch |
| Hono API | Stripe | HTTPS | REST API |
| Stripe | Hono API | HTTPS | Webhooks (POST /api/webhooks/stripe) |
| Hono API | Browser | HTTPS/SSE | Server-Sent Events (execution streaming) |

### 1.3 Deployment Topology

**Single Hetzner VPS (Phase 1: 0-5K users)**

```
Hetzner CPX41 (8 vCPU, 16 GB RAM, 240 GB NVMe)
├── Docker Compose
│   ├── caddy         (reverse proxy, TLS)
│   ├── nextjs        (frontend SSR)
│   ├── hono-api      (backend API)
│   ├── bullmq-worker (job processing, 3 replicas)
│   ├── postgres      (database)
│   ├── redis         (cache + queue broker)
│   └── sandbox-pool  (pre-warmed Docker containers)
└── Host
    ├── Docker daemon (for sandbox execution)
    └── Cron (backups, cleanup)
```

**Phase 2 (5K-50K users):** Separate DB to Hetzner managed PostgreSQL, add second VPS for workers.

**Phase 3 (50K+ users):** Load balancer, multiple API nodes, dedicated worker fleet, read replicas.

---

## 2. Database Schema

### 2.1 Extensions and Types

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE user_role AS ENUM ('buyer', 'creator', 'affiliate', 'admin');
CREATE TYPE credit_tx_type AS ENUM (
  'purchase', 'signup_bonus', 'referral_bonus', 'refund',
  'debit_execution', 'debit_subscription', 'debit_license',
  'admin_grant', 'admin_deduct', 'promo'
);
CREATE TYPE purchase_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE tool_execution_type AS ENUM ('prompt', 'pipeline', 'docker', 'external_api', 'hybrid');
CREATE TYPE tool_status AS ENUM ('draft', 'pending_review', 'published', 'suspended', 'archived');
CREATE TYPE execution_status AS ENUM ('queued', 'running', 'completed', 'failed', 'timeout', 'cancelled');
CREATE TYPE pricing_model AS ENUM ('per_run', 'tiered', 'subscription', 'one_time', 'metered', 'free');
CREATE TYPE creator_level AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE creator_tx_type AS ENUM (
  'earning', 'payout', 'refund_clawback', 'bonus', 'admin_adjust'
);
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
CREATE TYPE affiliate_tier AS ENUM ('starter', 'partner', 'elite');
CREATE TYPE affiliate_tx_type AS ENUM ('commission', 'payout', 'bonus', 'adjustment');
CREATE TYPE report_reason AS ENUM (
  'malicious', 'misleading', 'broken', 'copyright', 'spam', 'inappropriate', 'other'
);
CREATE TYPE report_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');
CREATE TYPE tool_bundle_status AS ENUM ('draft', 'published', 'archived');
```

### 2.2 Core Tables

```sql
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255),           -- NULL for OAuth-only users
  avatar_url      VARCHAR(512),
  role            user_role NOT NULL DEFAULT 'buyer',
  credit_balance  INTEGER NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
  earnings_balance INTEGER NOT NULL DEFAULT 0 CHECK (earnings_balance >= 0),
  stripe_customer_id VARCHAR(255) UNIQUE,
  referral_code   VARCHAR(20) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(10), 'hex'),
  referred_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  free_credits_used INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- CREDIT TRANSACTIONS (append-only ledger)
-- ============================================================
CREATE TABLE credit_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            credit_tx_type NOT NULL,
  amount          INTEGER NOT NULL,       -- positive = credit, negative = debit
  balance_after   INTEGER NOT NULL,
  reference_id    UUID,                   -- FK to purchase, execution, etc.
  reference_type  VARCHAR(50),            -- 'credit_purchase', 'execution', 'subscription', etc.
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only: no UPDATE or DELETE permitted (enforce via app + RLS)
CREATE INDEX idx_credit_tx_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_tx_created_at ON credit_transactions(created_at);
CREATE INDEX idx_credit_tx_reference ON credit_transactions(reference_id, reference_type);

-- ============================================================
-- CREDIT PURCHASES
-- ============================================================
CREATE TABLE credit_purchases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package         VARCHAR(50) NOT NULL,   -- 'starter', 'popular', 'pro', 'business', 'enterprise'
  amount_usd      DECIMAL(10,2) NOT NULL CHECK (amount_usd > 0),
  credits_granted INTEGER NOT NULL CHECK (credits_granted > 0),
  payment_provider VARCHAR(20) NOT NULL DEFAULT 'stripe',
  payment_id      VARCHAR(255) NOT NULL,  -- Stripe Checkout Session or Payment Intent ID
  status          purchase_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX idx_credit_purchases_payment_id ON credit_purchases(payment_id);
CREATE INDEX idx_credit_purchases_status ON credit_purchases(status);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  slug            VARCHAR(100) NOT NULL UNIQUE,
  icon            VARCHAR(50),            -- emoji or icon class
  parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- ============================================================
-- TOOL TEMPLATES
-- ============================================================
CREATE TABLE tool_templates (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR(255) NOT NULL,
  description           TEXT,
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  base_config           JSONB NOT NULL DEFAULT '{}',
  input_schema_template JSONB NOT NULL DEFAULT '{}',
  icon                  VARCHAR(50),
  sort_order            INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- TOOLS
-- ============================================================
CREATE TABLE tools (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug             VARCHAR(255) NOT NULL UNIQUE,
  name             VARCHAR(255) NOT NULL,
  description      VARCHAR(500) NOT NULL,
  long_description TEXT,
  icon_url         VARCHAR(512),
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags             TEXT[] DEFAULT '{}',
  execution_type   tool_execution_type NOT NULL DEFAULT 'prompt',
  pricing          JSONB NOT NULL DEFAULT '{"model": "per_run", "credits_per_run": 5}',
  /*
    pricing JSONB examples:
    {"model": "per_run", "credits_per_run": 5}
    {"model": "tiered", "tiers": [{"min": 1, "max": 100, "credits": 5}, {"min": 101, "max": null, "credits": 3}]}
    {"model": "subscription", "credits_per_month": 50, "runs_limit": 100}
    {"model": "one_time", "credits": 200}
    {"model": "metered", "credits_per_unit": 1, "unit": "word"}
    {"model": "free"}
  */
  input_schema     JSONB NOT NULL DEFAULT '{}',  -- JSON Schema for tool input
  output_schema    JSONB,                         -- JSON Schema for tool output
  config           JSONB NOT NULL DEFAULT '{}',   -- execution config (prompts, pipeline steps, etc.)
  template_id      UUID REFERENCES tool_templates(id) ON DELETE SET NULL,
  demo_output      JSONB,                         -- sample output for preview
  seo_title        VARCHAR(70),
  seo_description  VARCHAR(160),
  status           tool_status NOT NULL DEFAULT 'draft',
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  total_runs       INTEGER NOT NULL DEFAULT 0,
  avg_rating       DECIMAL(3,2) DEFAULT NULL CHECK (avg_rating IS NULL OR (avg_rating >= 1.0 AND avg_rating <= 5.0)),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tools_creator_id ON tools(creator_id);
CREATE INDEX idx_tools_slug ON tools(slug);
CREATE INDEX idx_tools_category_id ON tools(category_id);
CREATE INDEX idx_tools_status ON tools(status);
CREATE INDEX idx_tools_status_featured ON tools(status, is_featured) WHERE status = 'published';
CREATE INDEX idx_tools_tags ON tools USING GIN(tags);
CREATE INDEX idx_tools_search ON tools USING GIN(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_tools_total_runs ON tools(total_runs DESC) WHERE status = 'published';

-- ============================================================
-- TOOL VERSIONS
-- ============================================================
CREATE TABLE tool_versions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id         UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL DEFAULT 1,
  config          JSONB NOT NULL DEFAULT '{}',
  input_schema    JSONB NOT NULL DEFAULT '{}',
  changelog       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tool_id, version)
);

CREATE INDEX idx_tool_versions_tool_id ON tool_versions(tool_id);
CREATE INDEX idx_tool_versions_active ON tool_versions(tool_id, is_active) WHERE is_active = TRUE;

-- ============================================================
-- EXECUTIONS
-- ============================================================
CREATE TABLE executions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id          UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_version_id  UUID REFERENCES tool_versions(id) ON DELETE SET NULL,
  status           execution_status NOT NULL DEFAULT 'queued',
  input            JSONB NOT NULL DEFAULT '{}',
  output           JSONB,
  error            TEXT,
  credits_charged  INTEGER NOT NULL DEFAULT 0,
  credits_refunded INTEGER NOT NULL DEFAULT 0,
  duration_ms      INTEGER,
  pricing_model    pricing_model NOT NULL DEFAULT 'per_run',
  pricing_tier     VARCHAR(50),           -- tier identifier if tiered pricing
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_executions_user_id ON executions(user_id);
CREATE INDEX idx_executions_tool_id ON executions(tool_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_created_at ON executions(created_at);
CREATE INDEX idx_executions_user_tool ON executions(user_id, tool_id);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id         UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating          SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tool_id, user_id)  -- one review per user per tool
);

CREATE INDEX idx_reviews_tool_id ON reviews(tool_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- ============================================================
-- API KEYS (BYOM — Bring Your Own Model)
-- ============================================================
CREATE TABLE api_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        VARCHAR(50) NOT NULL,   -- 'openai', 'anthropic', 'google', etc.
  encrypted_key   BYTEA NOT NULL,         -- AES-256-GCM encrypted
  label           VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE UNIQUE INDEX idx_api_keys_user_provider ON api_keys(user_id, provider);

-- ============================================================
-- CREATOR PROFILES
-- ============================================================
CREATE TABLE creator_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio             TEXT,
  specialization  VARCHAR(255),
  website         VARCHAR(512),
  social_links    JSONB DEFAULT '{}',     -- {"twitter": "...", "github": "...", ...}
  level           creator_level NOT NULL DEFAULT 'bronze',
  total_earnings  INTEGER NOT NULL DEFAULT 0,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX idx_creator_profiles_level ON creator_profiles(level);

-- ============================================================
-- CREATOR TRANSACTIONS (append-only ledger)
-- ============================================================
CREATE TABLE creator_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  type            creator_tx_type NOT NULL,
  amount          INTEGER NOT NULL,       -- positive = earning, negative = deduction
  balance_after   INTEGER NOT NULL,
  reference_id    UUID,
  reference_type  VARCHAR(50),            -- 'execution', 'payout', etc.
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creator_tx_creator_id ON creator_transactions(creator_id);
CREATE INDEX idx_creator_tx_created_at ON creator_transactions(created_at);

-- ============================================================
-- CREATOR PAYOUTS
-- ============================================================
CREATE TABLE creator_payouts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id        UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  amount_credits    INTEGER NOT NULL CHECK (amount_credits > 0),
  amount_usd        DECIMAL(10,2) NOT NULL CHECK (amount_usd > 0),
  status            payout_status NOT NULL DEFAULT 'pending',
  payout_method     VARCHAR(50) NOT NULL DEFAULT 'stripe_transfer',
  stripe_transfer_id VARCHAR(255),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at      TIMESTAMPTZ
);

CREATE INDEX idx_creator_payouts_creator_id ON creator_payouts(creator_id);
CREATE INDEX idx_creator_payouts_status ON creator_payouts(status);

-- ============================================================
-- TOOL SUBSCRIPTIONS
-- ============================================================
CREATE TABLE tool_subscriptions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id              UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  status               subscription_status NOT NULL DEFAULT 'active',
  credits_per_month    INTEGER NOT NULL CHECK (credits_per_month > 0),
  runs_used            INTEGER NOT NULL DEFAULT 0,
  runs_limit           INTEGER NOT NULL CHECK (runs_limit > 0),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end   TIMESTAMPTZ NOT NULL,
  next_billing_at      TIMESTAMPTZ NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tool_id)
);

CREATE INDEX idx_tool_subs_user_id ON tool_subscriptions(user_id);
CREATE INDEX idx_tool_subs_tool_id ON tool_subscriptions(tool_id);
CREATE INDEX idx_tool_subs_next_billing ON tool_subscriptions(next_billing_at) WHERE status = 'active';

-- ============================================================
-- TOOL LICENSES (one-time purchase)
-- ============================================================
CREATE TABLE tool_licenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id         UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,            -- NULL = lifetime
  credits_paid    INTEGER NOT NULL CHECK (credits_paid > 0),
  UNIQUE(user_id, tool_id)
);

CREATE INDEX idx_tool_licenses_user_id ON tool_licenses(user_id);
CREATE INDEX idx_tool_licenses_tool_id ON tool_licenses(tool_id);

-- ============================================================
-- TOOL BUNDLES
-- ============================================================
CREATE TABLE tool_bundles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  pricing         JSONB NOT NULL DEFAULT '{"credits": 100}',
  status          tool_bundle_status NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tool_bundles_creator_id ON tool_bundles(creator_id);

CREATE TABLE bundle_tools (
  bundle_id       UUID NOT NULL REFERENCES tool_bundles(id) ON DELETE CASCADE,
  tool_id         UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bundle_id, tool_id)
);

-- ============================================================
-- TOOL REPORTS
-- ============================================================
CREATE TABLE tool_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id         UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  reporter_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason          report_reason NOT NULL,
  description     TEXT,
  status          report_status NOT NULL DEFAULT 'open',
  reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tool_reports_tool_id ON tool_reports(tool_id);
CREATE INDEX idx_tool_reports_status ON tool_reports(status);

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE follows (
  follower_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, creator_id)
);

CREATE INDEX idx_follows_creator_id ON follows(creator_id);

-- ============================================================
-- TOOL COLLECTIONS
-- ============================================================
CREATE TABLE tool_collections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  curator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collection_tools (
  collection_id   UUID NOT NULL REFERENCES tool_collections(id) ON DELETE CASCADE,
  tool_id         UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, tool_id)
);

-- ============================================================
-- AFFILIATES
-- ============================================================
CREATE TABLE affiliates (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  affiliate_code      VARCHAR(30) NOT NULL UNIQUE,
  commission_rate     DECIMAL(5,4) NOT NULL DEFAULT 0.1000,  -- 10%
  tier                affiliate_tier NOT NULL DEFAULT 'starter',
  cookie_duration_days INTEGER NOT NULL DEFAULT 30,
  total_referrals     INTEGER NOT NULL DEFAULT 0,
  total_earnings      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status              VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);

-- ============================================================
-- AFFILIATE REFERRALS
-- ============================================================
CREATE TABLE affiliate_referrals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);

-- ============================================================
-- AFFILIATE TRANSACTIONS (append-only ledger)
-- ============================================================
CREATE TABLE affiliate_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  type            affiliate_tx_type NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  balance_after   DECIMAL(10,2) NOT NULL,
  reference_id    UUID,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_tx_affiliate_id ON affiliate_transactions(affiliate_id);
CREATE INDEX idx_affiliate_tx_created_at ON affiliate_transactions(created_at);

-- ============================================================
-- API TOKENS (programmatic access)
-- ============================================================
CREATE TABLE api_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  token_hash      VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 of the token
  permissions     JSONB NOT NULL DEFAULT '{"tools.execute": true, "tools.list": true}',
  rate_limit      INTEGER NOT NULL DEFAULT 100, -- requests per minute
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX idx_api_tokens_hash ON api_tokens(token_hash);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(50) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  body            TEXT,
  data            JSONB DEFAULT '{}',
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### 2.3 Materialized Views (for Analytics)

```sql
-- Tool leaderboard (refreshed every 5 minutes via pg_cron)
CREATE MATERIALIZED VIEW mv_tool_leaderboard AS
SELECT
  t.id,
  t.name,
  t.slug,
  t.category_id,
  t.total_runs,
  t.avg_rating,
  COUNT(DISTINCT e.user_id) AS unique_users_30d,
  COUNT(e.id) FILTER (WHERE e.created_at > NOW() - INTERVAL '30 days') AS runs_30d
FROM tools t
LEFT JOIN executions e ON e.tool_id = t.id
WHERE t.status = 'published'
GROUP BY t.id;

CREATE UNIQUE INDEX idx_mv_tool_leaderboard_id ON mv_tool_leaderboard(id);
```

### 2.4 Row-Level Security Note

Append-only tables (`credit_transactions`, `creator_transactions`, `affiliate_transactions`) must have application-level enforcement preventing UPDATE/DELETE. Optionally enforce via triggers:

```sql
CREATE OR REPLACE FUNCTION prevent_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'UPDATE and DELETE are not permitted on append-only ledger tables';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_credit_tx_immutable
  BEFORE UPDATE OR DELETE ON credit_transactions
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER trg_creator_tx_immutable
  BEFORE UPDATE OR DELETE ON creator_transactions
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER trg_affiliate_tx_immutable
  BEFORE UPDATE OR DELETE ON affiliate_transactions
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
```

---

## 3. API Specification

**Base URL:** `https://sotally.com/api`

**Authentication:** Bearer token (JWT from NextAuth) or API token (`X-API-Key` header).

**Standard Error Response:**

```typescript
interface ApiError {
  error: {
    code: string;        // e.g., "INSUFFICIENT_CREDITS"
    message: string;
    details?: unknown;
  };
}
```

**Standard Pagination:**

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}
```

### 3.1 Auth

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/auth/register` | None | 5/min/IP | Register new user |
| POST | `/auth/login` | None | 10/min/IP | Email/password login |
| POST | `/auth/logout` | JWT | 10/min | Invalidate session |
| GET | `/auth/me` | JWT | 60/min | Get current user |
| PATCH | `/auth/me` | JWT | 10/min | Update profile |
| POST | `/auth/forgot-password` | None | 3/min/IP | Request password reset |
| POST | `/auth/reset-password` | None | 3/min/IP | Reset password with token |
| POST | `/auth/verify-email` | None | 5/min/IP | Verify email address |

```typescript
// POST /auth/register
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  referral_code?: string;
}
interface RegisterResponse {
  user: { id: string; email: string; name: string; role: string; credit_balance: number };
  token: string;
}

// POST /auth/login
interface LoginRequest {
  email: string;
  password: string;
}
interface LoginResponse {
  user: { id: string; email: string; name: string; role: string; credit_balance: number };
  token: string;
}

// GET /auth/me
interface MeResponse {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  credit_balance: number;
  earnings_balance: number;
  referral_code: string;
  created_at: string;
}

// PATCH /auth/me
interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
}
```

### 3.2 Credits

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/credits/balance` | JWT | 60/min | Get credit balance |
| GET | `/credits/transactions` | JWT | 30/min | Get transaction history |
| POST | `/credits/purchase` | JWT | 5/min | Create Stripe Checkout session |
| GET | `/credits/packages` | None | 60/min | List available credit packages |

```typescript
// GET /credits/balance
interface BalanceResponse {
  credit_balance: number;
  earnings_balance: number;
}

// GET /credits/transactions?page=1&per_page=20&type=debit_execution
interface CreditTransactionItem {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}
// Response: PaginatedResponse<CreditTransactionItem>

// POST /credits/purchase
interface PurchaseRequest {
  package: 'starter' | 'popular' | 'pro' | 'business';
  success_url: string;
  cancel_url: string;
}
interface PurchaseResponse {
  checkout_url: string;    // Stripe Checkout URL
  session_id: string;
}

// GET /credits/packages
interface CreditPackage {
  id: string;
  name: string;
  price_usd: number;
  credits: number;
  bonus_percent: number;
}
interface PackagesResponse {
  packages: CreditPackage[];
}
```

### 3.3 Tools

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/tools` | None | 60/min | List/search tools |
| GET | `/tools/:slug` | None | 60/min | Get tool detail |
| POST | `/tools` | JWT (creator) | 10/min | Create tool |
| PATCH | `/tools/:id` | JWT (owner) | 20/min | Update tool |
| DELETE | `/tools/:id` | JWT (owner) | 5/min | Archive tool |
| POST | `/tools/:id/publish` | JWT (owner) | 5/min | Submit for review / publish |
| GET | `/tools/:id/versions` | JWT (owner) | 30/min | List versions |
| POST | `/tools/:id/versions` | JWT (owner) | 10/min | Create new version |
| GET | `/tools/:slug/reviews` | None | 60/min | List reviews |
| POST | `/tools/:slug/reviews` | JWT | 5/min | Create review |
| POST | `/tools/:id/report` | JWT | 3/min | Report a tool |
| GET | `/tools/categories` | None | 60/min | List categories |
| GET | `/tools/featured` | None | 60/min | Get featured tools |
| GET | `/tools/templates` | JWT (creator) | 30/min | List tool templates |

```typescript
// GET /tools?q=seo&category=marketing&sort=popular&page=1&per_page=20
interface ToolListItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string | null;
  category: { id: string; name: string; slug: string } | null;
  tags: string[];
  pricing: ToolPricing;
  total_runs: number;
  avg_rating: number | null;
  creator: { id: string; name: string; avatar_url: string | null };
  is_featured: boolean;
}
// Response: PaginatedResponse<ToolListItem>

// GET /tools/:slug
interface ToolDetail extends ToolListItem {
  long_description: string | null;
  execution_type: string;
  input_schema: object;
  output_schema: object | null;
  demo_output: object | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// POST /tools
interface CreateToolRequest {
  name: string;
  slug: string;
  description: string;
  long_description?: string;
  category_id?: string;
  tags?: string[];
  execution_type: 'prompt' | 'pipeline' | 'docker' | 'external_api' | 'hybrid';
  pricing: ToolPricing;
  input_schema: object;
  output_schema?: object;
  config: object;
  template_id?: string;
  demo_output?: object;
}

interface ToolPricing {
  model: 'per_run' | 'tiered' | 'subscription' | 'one_time' | 'metered' | 'free';
  credits_per_run?: number;
  tiers?: { min: number; max: number | null; credits: number }[];
  credits_per_month?: number;
  runs_limit?: number;
  credits?: number;
  credits_per_unit?: number;
  unit?: string;
}

// POST /tools/:slug/reviews
interface CreateReviewRequest {
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}
```

### 3.4 Executions

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/executions` | JWT | 30/min/user, 100/min/tool | Run a tool |
| GET | `/executions/:id` | JWT | 60/min | Get execution result |
| GET | `/executions/:id/stream` | JWT | 60/min | SSE stream for execution |
| GET | `/executions` | JWT | 30/min | List user's executions |
| POST | `/executions/:id/cancel` | JWT | 10/min | Cancel running execution |

```typescript
// POST /executions
interface ExecuteRequest {
  tool_id: string;
  input: Record<string, unknown>;
  use_own_key?: boolean;       // BYOM: use user's own API key
}
interface ExecuteResponse {
  execution_id: string;
  status: 'queued' | 'running';
  credits_charged: number;
  stream_url: string;          // SSE endpoint
}

// GET /executions/:id
interface ExecutionResult {
  id: string;
  tool_id: string;
  status: string;
  input: object;
  output: object | null;
  error: string | null;
  credits_charged: number;
  credits_refunded: number;
  duration_ms: number | null;
  pricing_model: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// GET /executions/:id/stream (SSE)
// Events:
//   event: status     data: {"status": "running"}
//   event: progress   data: {"step": 2, "total": 5, "message": "Generating..."}
//   event: output     data: {"partial": "...chunk..."}
//   event: complete   data: {"output": {...}, "credits_charged": 5, "duration_ms": 2340}
//   event: error      data: {"error": "...", "credits_refunded": 5}
```

### 3.5 Creator

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/creator/profile` | JWT (creator) | 30/min | Get creator profile |
| PATCH | `/creator/profile` | JWT (creator) | 10/min | Update creator profile |
| GET | `/creator/analytics` | JWT (creator) | 30/min | Dashboard analytics |
| GET | `/creator/earnings` | JWT (creator) | 30/min | Earnings history |
| POST | `/creator/payouts` | JWT (creator) | 3/min | Request payout |
| GET | `/creator/payouts` | JWT (creator) | 30/min | List payouts |
| GET | `/creator/tools` | JWT (creator) | 30/min | List own tools (all statuses) |
| GET | `/creator/followers` | JWT (creator) | 30/min | List followers |

```typescript
// GET /creator/analytics?period=30d
interface CreatorAnalytics {
  period: string;
  total_runs: number;
  total_earnings: number;
  unique_users: number;
  tools_published: number;
  avg_rating: number | null;
  top_tools: { tool_id: string; name: string; runs: number; earnings: number }[];
  daily_stats: { date: string; runs: number; earnings: number }[];
}

// POST /creator/payouts
interface PayoutRequest {
  amount_credits: number;      // min 100 credits ($10)
}
interface PayoutResponse {
  payout_id: string;
  amount_credits: number;
  amount_usd: number;
  status: string;
  estimated_arrival: string;
}
```

### 3.6 Affiliates

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/affiliates/apply` | JWT | 3/min | Apply for affiliate program |
| GET | `/affiliates/dashboard` | JWT (affiliate) | 30/min | Affiliate dashboard |
| GET | `/affiliates/referrals` | JWT (affiliate) | 30/min | List referrals |
| GET | `/affiliates/transactions` | JWT (affiliate) | 30/min | Commission history |
| POST | `/affiliates/payouts` | JWT (affiliate) | 3/min | Request payout |

```typescript
// POST /affiliates/apply
interface AffiliateApplyRequest {
  website?: string;
  social_links?: Record<string, string>;
  marketing_plan?: string;
}
interface AffiliateApplyResponse {
  affiliate_id: string;
  affiliate_code: string;
  commission_rate: number;
  tracking_url: string;
}

// GET /affiliates/dashboard
interface AffiliateDashboard {
  affiliate_code: string;
  tier: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  referrals_30d: number;
  earnings_30d: number;
  tracking_url: string;
}
```

### 3.7 Settings

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/settings/api-keys` | JWT | 30/min | List BYOM API keys (redacted) |
| POST | `/settings/api-keys` | JWT | 5/min | Add API key |
| DELETE | `/settings/api-keys/:id` | JWT | 10/min | Remove API key |
| GET | `/settings/api-tokens` | JWT | 30/min | List API tokens |
| POST | `/settings/api-tokens` | JWT | 5/min | Create API token |
| DELETE | `/settings/api-tokens/:id` | JWT | 10/min | Revoke API token |
| GET | `/settings/notifications` | JWT | 30/min | Notification preferences |
| PATCH | `/settings/notifications` | JWT | 10/min | Update preferences |
| POST | `/settings/change-password` | JWT | 3/min | Change password |
| DELETE | `/settings/account` | JWT | 1/min | Delete account |

```typescript
// POST /settings/api-keys
interface AddApiKeyRequest {
  provider: 'openai' | 'anthropic' | 'google' | 'mistral';
  key: string;                 // plaintext, encrypted before storage
  label?: string;
}
interface AddApiKeyResponse {
  id: string;
  provider: string;
  label: string | null;
  last_four: string;           // last 4 chars of key
  created_at: string;
}

// POST /settings/api-tokens
interface CreateTokenRequest {
  name: string;
  permissions?: Record<string, boolean>;
  rate_limit?: number;
  expires_in_days?: number;
}
interface CreateTokenResponse {
  id: string;
  name: string;
  token: string;               // shown ONCE, then only hash stored
  permissions: object;
  rate_limit: number;
  expires_at: string | null;
  created_at: string;
}
```

### 3.8 Admin

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/admin/dashboard` | JWT (admin) | 30/min | Platform stats |
| GET | `/admin/users` | JWT (admin) | 30/min | List users |
| PATCH | `/admin/users/:id` | JWT (admin) | 10/min | Update user (role, ban) |
| GET | `/admin/tools/review-queue` | JWT (admin) | 30/min | Tools pending review |
| PATCH | `/admin/tools/:id/review` | JWT (admin) | 20/min | Approve/reject tool |
| GET | `/admin/reports` | JWT (admin) | 30/min | List tool reports |
| PATCH | `/admin/reports/:id` | JWT (admin) | 20/min | Resolve report |
| POST | `/admin/credits/grant` | JWT (admin) | 10/min | Grant credits to user |
| GET | `/admin/payouts` | JWT (admin) | 30/min | List pending payouts |
| PATCH | `/admin/payouts/:id` | JWT (admin) | 10/min | Process payout |
| GET | `/admin/analytics` | JWT (admin) | 30/min | Platform analytics |

```typescript
// GET /admin/dashboard
interface AdminDashboard {
  total_users: number;
  total_tools: number;
  total_executions_today: number;
  total_revenue_30d: number;
  pending_reviews: number;
  pending_payouts: number;
  open_reports: number;
  new_users_30d: number;
}

// PATCH /admin/tools/:id/review
interface ReviewToolRequest {
  action: 'approve' | 'reject';
  reason?: string;             // required if reject
}

// POST /admin/credits/grant
interface GrantCreditsRequest {
  user_id: string;
  amount: number;
  reason: string;
}
```

### 3.9 Webhooks (Incoming)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/webhooks/stripe` | Stripe signature | Stripe webhook handler |

**Handled Stripe Events:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Grant purchased credits, record transaction |
| `payment_intent.payment_failed` | Mark purchase as failed, notify user |
| `charge.refunded` | Deduct credits, record refund transaction |
| `transfer.updated` | Update payout status |

---

## 4. Tool Execution Engine

### 4.1 Execution Flow

```
 User                API Server              BullMQ              Worker
  │                     │                      │                    │
  │  POST /executions   │                      │                    │
  │────────────────────▶│                      │                    │
  │                     │                      │                    │
  │                     │ 1. Validate input     │                    │
  │                     │ 2. Resolve pricing    │                    │
  │                     │ 3. Hold credits (TX)  │                    │
  │                     │ 4. Create execution   │                    │
  │                     │    (status: queued)   │                    │
  │                     │                      │                    │
  │                     │ 5. Enqueue job       │                    │
  │                     │─────────────────────▶│                    │
  │                     │                      │                    │
  │  {execution_id,     │                      │ 6. Dequeue         │
  │   stream_url}       │                      │───────────────────▶│
  │◀────────────────────│                      │                    │
  │                     │                      │                    │
  │  GET /executions/   │                      │ 7. Execute tool    │
  │    :id/stream (SSE) │                      │    (prompt/pipe/   │
  │────────────────────▶│◀ ─ ─ Redis Pub/Sub ─ ┤    docker/api)    │
  │                     │                      │                    │
  │  event: progress    │                      │ 8. Publish progress│
  │◀────────────────────│◀─────────────────────┤◀───────────────────│
  │                     │                      │                    │
  │  event: complete    │                      │ 9. Commit credits  │
  │◀────────────────────│◀─────────────────────┤    OR refund       │
  │                     │                      │                    │
  │                     │                      │ 10. Update exec    │
  │                     │                      │     record         │
  │                     │                      │◀───────────────────│
  │                     │                      │                    │
```

### 4.2 No-Code Pipeline Runner

Tools with `execution_type = 'pipeline'` define a series of steps in `config.steps`:

```typescript
interface PipelineConfig {
  steps: PipelineStep[];
  variables: Record<string, string>;   // global variables
  max_steps: number;                   // hard cap: 20
  timeout_ms: number;                  // hard cap: 60000
}

type PipelineStep =
  | LLMStep
  | TransformStep
  | ConditionalStep
  | LoopStep
  | HttpStep
  | OutputStep;

interface LLMStep {
  type: 'llm';
  id: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  prompt: string;             // supports {{variable}} interpolation
  system_prompt?: string;
  temperature?: number;       // 0-2, default 0.7
  max_tokens?: number;        // default 1000, max 4000
  output_variable: string;    // stores result in variable namespace
}

interface TransformStep {
  type: 'transform';
  id: string;
  operation: 'json_extract' | 'regex' | 'split' | 'join' | 'template' | 'markdown_to_html';
  input_variable: string;
  params: Record<string, unknown>;
  output_variable: string;
}

interface ConditionalStep {
  type: 'conditional';
  id: string;
  condition: string;          // simple expression: "{{var}} == 'value'"
  then_steps: string[];       // step IDs to execute
  else_steps: string[];       // step IDs to execute
}

interface LoopStep {
  type: 'loop';
  id: string;
  over_variable: string;      // variable containing array
  max_iterations: number;     // hard cap: 10
  body_steps: string[];       // step IDs to execute per iteration
  item_variable: string;      // current item variable name
}

interface HttpStep {
  type: 'http';
  id: string;
  url: string;                // must pass SSRF validation
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;              // template with {{variables}}
  output_variable: string;
  timeout_ms: number;         // max 10000
}

interface OutputStep {
  type: 'output';
  id: string;
  template: string;           // final output template with {{variables}}
  format: 'text' | 'json' | 'markdown' | 'html';
}
```

**Variable Resolution:**
1. `{{input.field}}` -- resolves from user input
2. `{{steps.step_id}}` -- resolves from step output variable
3. `{{env.VARIABLE}}` -- resolves from tool's environment config (creator-set, not user-set)
4. `{{system.timestamp}}`, `{{system.execution_id}}` -- system variables

**Error Handling:**
- Each step has implicit try/catch
- On step failure: mark execution as failed, refund credits, report error with step ID
- Pipeline timeout: kill all pending steps, refund credits
- LLM step failure: retry once with exponential backoff, then fail

### 4.3 Docker Sandbox Spec

For `execution_type = 'docker'`:

```yaml
# Container constraints
resources:
  memory: 256MB              # hard limit, OOM-killed above this
  cpu: 0.5                   # 50% of one core
  pids: 64                   # max process count
  storage: 100MB             # writable layer limit

networking:
  mode: none                 # no network access by default
  # If tool requires network: restricted bridge with allowlist
  allowlist: []              # creator must declare domains

timeout:
  execution: 30s             # hard kill after 30s
  startup: 5s                # container must be ready in 5s

security:
  capabilities: []           # drop ALL capabilities
  read_only_rootfs: true
  no_new_privileges: true
  seccomp_profile: default   # Docker default seccomp
  user: "nobody:nogroup"     # non-root execution
  tmpfs:
    /tmp: "size=50M,noexec"
```

**Execution flow:**
1. Pull pre-warmed base image from pool (Node.js, Python, or custom)
2. Mount user input as `/input/data.json` (read-only)
3. Mount tool code as `/app/` (read-only)
4. Start container with above constraints
5. Read stdout as JSON output
6. Capture stderr for error reporting
7. Destroy container immediately after execution

### 4.4 External API Proxy Spec

For `execution_type = 'external_api'` or HTTP steps in pipelines:

**SSRF Prevention:**
```typescript
const BLOCKED_RANGES = [
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '127.0.0.0/8',
  '169.254.0.0/16',       // link-local / cloud metadata
  '0.0.0.0/8',
  '::1/128',
  'fc00::/7',
];

// Resolution: DNS-resolve hostname BEFORE connecting,
// verify resolved IP is not in blocked ranges.
// Use custom DNS resolver, not system resolver.
// Block redirects to internal IPs (re-validate after each redirect).
```

**Proxy constraints:**
- Request timeout: 10 seconds
- Response body max: 5 MB
- Max redirects: 3
- Allowed protocols: HTTPS only (HTTP blocked)
- User-Agent: `Sotally-Proxy/1.0`
- No cookie forwarding
- Retry: 1 retry on 5xx, with 1s backoff

### 4.5 Credit Deduction Protocol

Three-phase commit: HOLD, EXECUTE, COMMIT/REFUND.

```sql
-- Phase 1: HOLD (before execution starts)
-- Atomic: deduct credits + record transaction + create execution
BEGIN;

  -- Lock user row to prevent concurrent overdraft
  SELECT credit_balance FROM users WHERE id = $user_id FOR UPDATE;

  -- Check sufficient balance
  -- If credit_balance < $credits_required: ROLLBACK, return error

  -- Deduct credits
  UPDATE users
  SET credit_balance = credit_balance - $credits_required,
      updated_at = NOW()
  WHERE id = $user_id
    AND credit_balance >= $credits_required;

  -- Record transaction
  INSERT INTO credit_transactions (user_id, type, amount, balance_after, reference_id, reference_type, description)
  VALUES (
    $user_id,
    'debit_execution',
    -$credits_required,
    (SELECT credit_balance FROM users WHERE id = $user_id),
    $execution_id,
    'execution',
    'Tool execution: ' || $tool_name
  );

  -- Create execution record
  INSERT INTO executions (id, tool_id, user_id, tool_version_id, status, input, credits_charged, pricing_model, pricing_tier)
  VALUES ($execution_id, $tool_id, $user_id, $version_id, 'queued', $input, $credits_required, $pricing_model, $pricing_tier);

COMMIT;

-- Phase 2: EXECUTE (handled by worker)
-- ... tool runs ...

-- Phase 3a: COMMIT (on success)
BEGIN;

  UPDATE executions
  SET status = 'completed',
      output = $output,
      duration_ms = $duration,
      completed_at = NOW()
  WHERE id = $execution_id;

  -- Credit creator (70% of credits charged; 30% platform fee)
  UPDATE users
  SET earnings_balance = earnings_balance + FLOOR($credits_required * 0.70),
      updated_at = NOW()
  WHERE id = $creator_id;

  INSERT INTO creator_transactions (creator_id, type, amount, balance_after, reference_id, reference_type, description)
  VALUES (
    $creator_profile_id,
    'earning',
    FLOOR($credits_required * 0.70),
    (SELECT total_earnings + FLOOR($credits_required * 0.70) FROM creator_profiles WHERE id = $creator_profile_id),
    $execution_id,
    'execution',
    'Earning from tool: ' || $tool_name
  );

  UPDATE creator_profiles
  SET total_earnings = total_earnings + FLOOR($credits_required * 0.70)
  WHERE id = $creator_profile_id;

  -- Update tool stats
  UPDATE tools SET total_runs = total_runs + 1, updated_at = NOW() WHERE id = $tool_id;

COMMIT;

-- Phase 3b: REFUND (on failure/timeout)
BEGIN;

  UPDATE executions
  SET status = 'failed',
      error = $error_message,
      credits_refunded = $credits_required,
      duration_ms = $duration,
      completed_at = NOW()
  WHERE id = $execution_id;

  -- Refund credits to user
  UPDATE users
  SET credit_balance = credit_balance + $credits_required,
      updated_at = NOW()
  WHERE id = $user_id;

  INSERT INTO credit_transactions (user_id, type, amount, balance_after, reference_id, reference_type, description)
  VALUES (
    $user_id,
    'refund',
    $credits_required,
    (SELECT credit_balance FROM users WHERE id = $user_id),
    $execution_id,
    'execution',
    'Refund: execution failed for ' || $tool_name
  );

COMMIT;
```

### 4.6 Pricing Resolution Algorithm

```typescript
function resolveCredits(
  tool: Tool,
  user: User,
  input: Record<string, unknown>
): { credits: number; model: string; tier: string | null } {
  const pricing = tool.pricing;

  switch (pricing.model) {
    case 'free':
      return { credits: 0, model: 'free', tier: null };

    case 'per_run':
      // BYOM discount: if user provides own API key, 50% off
      const base = pricing.credits_per_run!;
      const credits = user.usesOwnKey ? Math.ceil(base * 0.5) : base;
      return { credits, model: 'per_run', tier: null };

    case 'tiered': {
      // Based on user's total runs of this tool in current billing period
      const runCount = getUserToolRunCount(user.id, tool.id, currentPeriodStart());
      const tier = pricing.tiers!.find(
        t => runCount >= t.min && (t.max === null || runCount <= t.max)
      );
      return {
        credits: tier?.credits ?? pricing.tiers![0].credits,
        model: 'tiered',
        tier: `${tier?.min}-${tier?.max ?? 'unlimited'}`,
      };
    }

    case 'subscription': {
      // Check active subscription
      const sub = getActiveSubscription(user.id, tool.id);
      if (sub && sub.runs_used < sub.runs_limit) {
        // Included in subscription
        return { credits: 0, model: 'subscription', tier: 'included' };
      }
      if (sub && sub.runs_used >= sub.runs_limit) {
        // Overage: charge per-run fallback
        return { credits: pricing.credits_per_run ?? 5, model: 'subscription', tier: 'overage' };
      }
      // No subscription: charge full per-run price
      return { credits: pricing.credits_per_run ?? 5, model: 'per_run', tier: null };
    }

    case 'one_time': {
      // Check license
      const license = getLicense(user.id, tool.id);
      if (license && (!license.expires_at || license.expires_at > new Date())) {
        return { credits: 0, model: 'one_time', tier: 'licensed' };
      }
      // Must purchase license first
      throw new Error('LICENSE_REQUIRED');
    }

    case 'metered': {
      // Calculate based on input size (e.g., word count)
      const unitCount = calculateUnits(input, pricing.unit!);
      const credits = unitCount * pricing.credits_per_unit!;
      return { credits: Math.max(1, credits), model: 'metered', tier: `${unitCount} ${pricing.unit}s` };
    }

    default:
      throw new Error('UNKNOWN_PRICING_MODEL');
  }
}
```

---

## 5. Security Specifications

### 5.1 Authentication Flow (NextAuth.js JWT)

```
Browser                    Next.js                 Hono API
  │                          │                        │
  │ POST /api/auth/signin    │                        │
  │─────────────────────────▶│                        │
  │                          │ verify credentials     │
  │                          │ (bcrypt compare)       │
  │                          │                        │
  │  Set-Cookie: session JWT │                        │
  │◀─────────────────────────│                        │
  │                          │                        │
  │ GET /api/tools           │                        │
  │─────────────────────────▶│                        │
  │                          │ Forward: Authorization │
  │                          │   Bearer <JWT>         │
  │                          │───────────────────────▶│
  │                          │                        │ Verify JWT
  │                          │                        │ (HMAC-SHA256)
  │                          │                        │ Extract user_id, role
  │                          │      Response          │
  │◀─────────────────────────│◀───────────────────────│
```

**JWT Configuration:**
```typescript
{
  strategy: 'jwt',
  secret: process.env.NEXTAUTH_SECRET,   // 64-byte random
  maxAge: 7 * 24 * 60 * 60,             // 7 days
  encode: jose.SignJWT (HS256),
  payload: {
    sub: user.id,        // UUID
    email: user.email,
    name: user.name,
    role: user.role,
    iat: number,
    exp: number,
  }
}
```

**OAuth Providers:** Google, GitHub (Phase 1). Account linking by email.

### 5.2 Authorization Model

```typescript
const PERMISSIONS: Record<string, string[]> = {
  buyer:     ['tools.list', 'tools.view', 'tools.execute', 'credits.purchase',
              'reviews.create', 'settings.manage', 'executions.own'],
  creator:   ['...buyer', 'tools.create', 'tools.edit.own', 'tools.publish',
              'creator.profile', 'creator.analytics', 'creator.payouts'],
  affiliate: ['...buyer', 'affiliates.dashboard', 'affiliates.payouts'],
  admin:     ['*'],  // all permissions
};

// Middleware: checkPermission('tools.create')
// Checks: jwt.role has permission OR user.id === resource.owner_id for .own permissions
```

**Role escalation:**
- `buyer` is default for all new users
- `creator` is granted when user creates their first tool (auto-upgrade)
- `affiliate` is granted via admin approval of application
- A user can hold multiple roles (stored as single enum, but `creator` implies `buyer`)
- `admin` is set manually in database

### 5.3 API Key Encryption (BYOM)

```typescript
// AES-256-GCM encryption for stored API keys
const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.API_KEY_ENCRYPTION_KEY, 'hex'); // 32 bytes
const IV_LENGTH = 12;   // 96 bits for GCM
const TAG_LENGTH = 16;  // 128-bit auth tag

function encrypt(plaintext: string): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Storage format: [IV (12)] [TAG (16)] [CIPHERTEXT (N)]
  return Buffer.concat([iv, tag, encrypted]);
}

function decrypt(data: Buffer): string {
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}
```

**Key rotation:** Encryption key versioned via `KEY_VERSION` prefix byte. Old keys decryptable with prior version. Re-encrypt on next use.

### 5.4 Docker Sandbox Security

```yaml
# Seccomp profile: Docker default (blocks ~44 dangerous syscalls)
# Capabilities: ALL dropped
# Filesystem: read-only root, tmpfs for /tmp
# Network: none (or restricted allowlist bridge)
# User namespace: enabled (maps to nobody inside container)
# PID namespace: isolated
# No privileged mode
# No access to Docker socket
# No access to host filesystem (bind mounts are read-only, scoped)

docker_run_flags:
  - "--rm"
  - "--network=none"
  - "--read-only"
  - "--tmpfs /tmp:size=50M,noexec,nosuid"
  - "--memory=256m"
  - "--cpus=0.5"
  - "--pids-limit=64"
  - "--security-opt=no-new-privileges"
  - "--cap-drop=ALL"
  - "--user=65534:65534"
  - "--stop-timeout=30"
```

### 5.5 SSRF Prevention

Applied to all outbound HTTP requests from tool execution:

1. **DNS resolution check:** Resolve hostname before connecting. Reject if IP in private ranges.
2. **URL scheme allowlist:** HTTPS only.
3. **Port restriction:** 443 only (or 80 with redirect to 443).
4. **Redirect following:** Re-validate DNS on each redirect hop. Max 3 redirects.
5. **Blocked hosts:** `localhost`, `*.internal`, `metadata.google.internal`, `169.254.169.254`.
6. **Response size limit:** 5 MB.
7. **Timeout:** 10 seconds total (connection + read).

### 5.6 Rate Limiting

Implemented via Redis sliding window counters.

| Scope | Limit | Window | Key Pattern |
|-------|-------|--------|-------------|
| Global (all requests) | 1000/min | 1 min | `rl:global` |
| Per IP (unauthenticated) | 60/min | 1 min | `rl:ip:{ip}` |
| Per user (authenticated) | 120/min | 1 min | `rl:user:{uid}` |
| Per user per tool (execution) | 30/min | 1 min | `rl:exec:{uid}:{tid}` |
| Auth endpoints (per IP) | 10/min | 1 min | `rl:auth:{ip}` |
| Webhook endpoints | 100/min | 1 min | `rl:webhook:{source}` |

**Response headers:**
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1710601200
```

**Exceeded:** HTTP 429 with `Retry-After` header.

### 5.7 Input Validation (Zod)

All API inputs validated with Zod schemas before processing:

```typescript
// Example: execution input validation
const executeSchema = z.object({
  tool_id: z.string().uuid(),
  input: z.record(z.unknown()).refine(
    (val) => JSON.stringify(val).length <= 100_000,  // 100KB max input
    'Input too large'
  ),
  use_own_key: z.boolean().optional().default(false),
});

// Tool input further validated against tool.input_schema (JSON Schema)
// using Ajv with strict mode and $data references disabled.
```

**Validation rules applied globally:**
- String fields: max length enforced, HTML stripped (DOMPurify on output)
- UUIDs: format validated
- Pagination: page >= 1, per_page 1-100
- Sort fields: allowlist only
- JSONB fields: max depth 10, max size 1 MB

### 5.8 CORS, CSRF, XSS

**CORS:**
```typescript
{
  origin: ['https://sotally.com'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
  maxAge: 86400,
}
```

**CSRF:**
- JWT in `Authorization` header (not cookies) for API requests: immune to CSRF.
- NextAuth session cookie: `SameSite=Lax`, `Secure`, `HttpOnly`.
- State parameter for OAuth flows.

**XSS:**
- All user-generated content sanitized on output (DOMPurify).
- CSP header: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https:; connect-src 'self' https://api.stripe.com`.
- No `dangerouslySetInnerHTML` without sanitization.

### 5.9 Secrets Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| `NEXTAUTH_SECRET` | Environment variable | Every 90 days |
| `DATABASE_URL` | Environment variable | On compromise |
| `REDIS_URL` | Environment variable | On compromise |
| `STRIPE_SECRET_KEY` | Environment variable | Via Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | Environment variable | On endpoint recreation |
| `API_KEY_ENCRYPTION_KEY` | Environment variable | Versioned, yearly |
| OAuth client secrets | Environment variable | Via provider dashboard |

All secrets loaded from `.env` file (not committed) and Docker Compose secrets. Production secrets managed via Hetzner Cloud environment variables or a mounted secrets file with 0600 permissions.

---

## 6. Performance Requirements

### 6.1 Response Time Targets

| Operation | p50 | p95 | p99 |
|-----------|-----|-----|-----|
| API response (non-execution) | < 100ms | < 500ms | < 1s |
| Tool execution (prompt/simple) | < 3s | < 10s | < 30s |
| Tool execution (pipeline) | < 5s | < 15s | < 30s |
| Tool execution (docker) | < 10s | < 20s | < 30s |
| Page load (SSR) | < 200ms | < 500ms | < 1s |
| Search query | < 50ms | < 200ms | < 500ms |

### 6.2 Concurrency Targets

| Phase | Users | Concurrent Executions | API RPS |
|-------|-------|-----------------------|---------|
| Phase 1 (launch) | 0-5K | 50 | 200 |
| Phase 2 (growth) | 5K-50K | 200 | 1,000 |
| Phase 3 (scale) | 50K+ | 1,000 | 5,000 |

### 6.3 Database Query Targets

| Query Type | Target |
|------------|--------|
| Simple lookup (by PK/unique) | < 5ms |
| Filtered list with pagination | < 20ms |
| Full-text search | < 50ms |
| Aggregation (analytics) | < 200ms |
| Complex join (admin reports) | < 500ms |

**Connection pool:** 20 connections (Drizzle + node-postgres). Configured via `DATABASE_POOL_SIZE`.

### 6.4 Caching Strategy (Redis)

| Key Pattern | TTL | Invalidation | Purpose |
|-------------|-----|--------------|---------|
| `cache:tool:{slug}` | 5 min | On tool update | Tool detail page |
| `cache:tools:featured` | 5 min | On feature toggle | Homepage featured tools |
| `cache:tools:category:{slug}:p{page}` | 2 min | On new tool in category | Category listings |
| `cache:user:{id}:balance` | 30 sec | On credit change | Balance display |
| `cache:categories` | 1 hour | On category CRUD | Category list |
| `cache:packages` | 1 hour | On config change | Credit packages |
| `cache:creator:{id}:analytics` | 5 min | On execution complete | Creator dashboard |
| `session:{token}` | 7 days | On logout | Session data |
| `rl:{scope}:{key}` | 1 min | Auto-expire | Rate limiting |
| `exec:stream:{id}` | 5 min | On execution complete | SSE pub/sub channel |

**Cache invalidation:** Write-through for critical data (balance), TTL-based for read-heavy data (listings).

---

## 7. Infrastructure Spec

### 7.1 Docker Compose

```yaml
version: "3.9"

services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - nextjs
      - hono-api
    networks:
      - frontend

  nextjs:
    build:
      context: .
      dockerfile: Dockerfile.nextjs
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXTAUTH_URL=https://sotally.com
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - API_URL=http://hono-api:4000
    expose:
      - "3000"
    depends_on:
      - hono-api
    networks:
      - frontend
      - backend
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "2.0"

  hono-api:
    build:
      context: .
      dockerfile: Dockerfile.api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://sotally:${DB_PASSWORD}@postgres:5432/sotally
      - REDIS_URL=redis://redis:6379
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - API_KEY_ENCRYPTION_KEY=${API_KEY_ENCRYPTION_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    expose:
      - "4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "2.0"

  bullmq-worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://sotally:${DB_PASSWORD}@postgres:5432/sotally
      - REDIS_URL=redis://redis:6379
      - API_KEY_ENCRYPTION_KEY=${API_KEY_ENCRYPTION_KEY}
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend
      - sandbox
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
          cpus: "1.0"

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_DB=sotally
      - POSTGRES_USER=sotally
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    expose:
      - "5432"
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sotally"]
      interval: 5s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"
    command: >
      postgres
        -c shared_buffers=1GB
        -c effective_cache_size=3GB
        -c maintenance_work_mem=256MB
        -c work_mem=16MB
        -c wal_level=replica
        -c max_wal_size=2GB
        -c min_wal_size=1GB
        -c checkpoint_completion_target=0.9
        -c random_page_cost=1.1
        -c effective_io_concurrency=200
        -c max_connections=100
        -c log_min_duration_statement=200

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    expose:
      - "6379"
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "0.5"
    command: >
      redis-server
        --maxmemory 768mb
        --maxmemory-policy allkeys-lru
        --appendonly yes
        --appendfsync everysec
        --save 900 1
        --save 300 10

volumes:
  postgres_data:
  redis_data:
  caddy_data:
  caddy_config:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
  sandbox:
    driver: bridge
    internal: true
```

### 7.2 Caddyfile

```
sotally.com {
    # API routes
    handle /api/* {
        reverse_proxy hono-api:4000
    }

    # Stripe webhooks (no rate limiting)
    handle /api/webhooks/* {
        reverse_proxy hono-api:4000
    }

    # SSE streams (long-lived connections)
    handle /api/executions/*/stream {
        reverse_proxy hono-api:4000 {
            flush_interval -1
            transport http {
                read_timeout 60s
            }
        }
    }

    # Everything else -> Next.js
    handle {
        reverse_proxy nextjs:3000
    }

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
        Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com"
        -Server
    }

    # Compression
    encode gzip zstd

    # Logging
    log {
        output file /var/log/caddy/access.log {
            roll_size 100MiB
            roll_keep 5
        }
    }
}
```

### 7.3 Backup Strategy

| What | Method | Schedule | Retention | Offsite |
|------|--------|----------|-----------|---------|
| PostgreSQL (full) | `pg_dump --format=custom` | Daily 02:00 UTC | 30 days | Hetzner Object Storage (S3-compatible) |
| PostgreSQL (WAL) | Continuous archiving | Continuous | 7 days | Hetzner Object Storage |
| Redis (RDB) | `redis-cli BGSAVE` | Every 6 hours | 7 days | Hetzner Object Storage |
| Docker volumes | `tar` of named volumes | Weekly | 4 weeks | Hetzner Object Storage |
| Application code | Git repository | On push | Unlimited | GitHub |

**Backup script** (cron at 02:00 UTC):
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups

# PostgreSQL
docker exec postgres pg_dump -U sotally -Fc sotally > $BACKUP_DIR/pg_$TIMESTAMP.dump

# Upload to S3
aws s3 cp $BACKUP_DIR/pg_$TIMESTAMP.dump s3://sotally-backups/postgres/pg_$TIMESTAMP.dump \
  --endpoint-url https://fsn1.your-objectstorage.com

# Cleanup local (keep 3 days)
find $BACKUP_DIR -name "pg_*.dump" -mtime +3 -delete
```

**Recovery Time Objective (RTO):** < 1 hour.
**Recovery Point Objective (RPO):** < 1 hour (WAL archiving enables point-in-time recovery).

### 7.4 Monitoring (BetterStack)

**Integration points:**

| Component | Metric Source | Alert Threshold |
|-----------|---------------|-----------------|
| Caddy | Access logs (shipped via Vector) | 5xx rate > 1% |
| Hono API | Custom metrics endpoint `/health` | Response time p95 > 1s |
| PostgreSQL | `pg_stat_statements`, connection count | Connections > 80, query time > 500ms |
| Redis | `INFO` command metrics | Memory > 90%, evictions > 0 |
| BullMQ | Queue depth, failed jobs | Queue depth > 100, failed > 5/min |
| Docker sandbox | Container count, OOM kills | OOM kills > 0, containers > 50 |
| Disk | `df` | Usage > 80% |
| SSL | Certificate expiry | < 14 days |

**Health endpoint** (`GET /health`):
```json
{
  "status": "healthy",
  "version": "1.2.3",
  "uptime_seconds": 86400,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "queue": "ok"
  }
}
```

**Uptime monitoring:** BetterStack pings `https://sotally.com/health` every 60 seconds. Alert via SMS + email on failure.

### 7.5 CI/CD Pipeline

```
GitHub Push (main)
       │
       ▼
┌─────────────────────┐
│  GitHub Actions      │
│                      │
│  1. Install deps     │
│  2. Lint (ESLint)    │
│  3. Type check (tsc) │
│  4. Unit tests       │
│  5. Build Next.js    │
│  6. Build Docker     │
│     images           │
│  7. Push to GHCR     │
└──────────┬───────────┘
           │
           ▼
┌─────────────────────┐
│  Deploy (SSH)        │
│                      │
│  1. SSH to VPS       │
│  2. docker compose   │
│     pull             │
│  3. docker compose   │
│     up -d            │
│  4. Health check     │
│  5. Notify BetterStack│
└──────────────────────┘
```

**Branch strategy:**
- `main`: production, protected, requires PR
- `develop`: staging/integration
- `feat/*`, `fix/*`: feature branches

**Deploy trigger:** Merge to `main` auto-deploys. Manual rollback via `docker compose up -d --force-recreate` with previous image tag.

---

## 8. Data Flow Diagrams

### 8.1 Tool Execution (Buyer Runs a Tool)

```
Buyer            Frontend         API Server        Redis/BullMQ      Worker           DB
  │                 │                 │                  │               │               │
  │ Click "Run"     │                 │                  │               │               │
  │ + fill inputs   │                 │                  │               │               │
  │────────────────▶│                 │                  │               │               │
  │                 │ POST /executions│                  │               │               │
  │                 │────────────────▶│                  │               │               │
  │                 │                 │                  │               │               │
  │                 │                 │ Validate input (Zod + JSON Schema)               │
  │                 │                 │ Resolve pricing  │               │               │
  │                 │                 │──────────────────────────────────────────────────▶│
  │                 │                 │ BEGIN TX: deduct credits, create execution       │
  │                 │                 │◀─────────────────────────────────────────────────│
  │                 │                 │                  │               │               │
  │                 │                 │ Enqueue job      │               │               │
  │                 │                 │─────────────────▶│               │               │
  │                 │                 │                  │               │               │
  │                 │ {exec_id,       │                  │               │               │
  │                 │  stream_url}    │                  │               │               │
  │                 │◀────────────────│                  │               │               │
  │                 │                 │                  │               │               │
  │                 │ Open SSE        │                  │ Dequeue       │               │
  │                 │ connection      │                  │──────────────▶│               │
  │                 │────────────────▶│                  │               │               │
  │                 │                 │                  │               │ Execute tool  │
  │                 │                 │                  │               │ (LLM/pipe/    │
  │                 │                 │                  │               │  docker/API)  │
  │                 │                 │                  │               │               │
  │                 │                 │  Redis PubSub    │◀──progress────│               │
  │ SSE: progress   │◀───────────────│◀─────────────────│               │               │
  │◀────────────────│                 │                  │               │               │
  │                 │                 │                  │               │               │
  │                 │                 │  Redis PubSub    │◀──complete────│               │
  │ SSE: complete   │◀───────────────│◀─────────────────│               │               │
  │◀────────────────│                 │                  │               │──────────────▶│
  │                 │                 │                  │               │ COMMIT: update│
  │ Display output  │                 │                  │               │ execution,    │
  │◀────────────────│                 │                  │               │ credit creator│
  │                 │                 │                  │               │               │
```

### 8.2 Credit Purchase (Buyer Buys Credits)

```
Buyer            Frontend         API Server        Stripe           DB
  │                 │                 │                │               │
  │ Select package  │                 │                │               │
  │────────────────▶│                 │                │               │
  │                 │ POST /credits/  │                │               │
  │                 │   purchase      │                │               │
  │                 │────────────────▶│                │               │
  │                 │                 │                │               │
  │                 │                 │ Create Checkout│               │
  │                 │                 │   Session      │               │
  │                 │                 │───────────────▶│               │
  │                 │                 │                │               │
  │                 │                 │ {checkout_url} │               │
  │                 │                 │◀───────────────│               │
  │                 │                 │                │               │
  │                 │                 │────────────────────────────────▶│
  │                 │                 │ Create purchase│               │
  │                 │                 │ (status:pending)               │
  │                 │                 │                │               │
  │                 │ {checkout_url}  │                │               │
  │                 │◀────────────────│                │               │
  │                 │                 │                │               │
  │ Redirect to     │                 │                │               │
  │ Stripe Checkout │                 │                │               │
  │────────────────────────────────────────────────────▶               │
  │                 │                 │                │               │
  │ Complete payment│                 │                │               │
  │─────────────────────────────────────────────────────▶              │
  │                 │                 │                │               │
  │                 │                 │  Webhook:      │               │
  │                 │                 │  checkout.     │               │
  │                 │                 │  session.      │               │
  │                 │                 │  completed     │               │
  │                 │                 │◀───────────────│               │
  │                 │                 │                │               │
  │                 │                 │ Verify signature               │
  │                 │                 │ BEGIN TX:      │               │
  │                 │                 │──────────────────────────────▶│
  │                 │                 │  Update purchase (completed)  │
  │                 │                 │  Add credits to user          │
  │                 │                 │  Record credit_transaction    │
  │                 │                 │  (Check affiliate, grant      │
  │                 │                 │   commission if applicable)   │
  │                 │                 │◀──────────────────────────────│
  │                 │                 │                │               │
  │ Redirect to     │                 │                │               │
  │ success page    │                 │                │               │
  │◀───────────────────────────────────────────────────│               │
  │                 │                 │                │               │
  │ See updated     │                 │                │               │
  │ balance         │                 │                │               │
  │◀────────────────│                 │                │               │
```

### 8.3 Creator Payout (Creator Cashes Out)

```
Creator          Frontend         API Server        Stripe           DB
  │                 │                 │                │               │
  │ Request payout  │                 │                │               │
  │ ($50 minimum)   │                 │                │               │
  │────────────────▶│                 │                │               │
  │                 │ POST /creator/  │                │               │
  │                 │   payouts       │                │               │
  │                 │────────────────▶│                │               │
  │                 │                 │                │               │
  │                 │                 │ Validate:      │               │
  │                 │                 │  - balance >= amount           │
  │                 │                 │  - amount >= minimum (100cr)   │
  │                 │                 │  - Stripe Connect account      │
  │                 │                 │                │               │
  │                 │                 │──────────────────────────────▶│
  │                 │                 │ BEGIN TX:      │               │
  │                 │                 │  Deduct earnings_balance      │
  │                 │                 │  Create creator_transaction   │
  │                 │                 │  Create payout (pending)      │
  │                 │                 │◀──────────────────────────────│
  │                 │                 │                │               │
  │                 │                 │ Create Stripe  │               │
  │                 │                 │   Transfer     │               │
  │                 │                 │───────────────▶│               │
  │                 │                 │                │               │
  │                 │                 │ {transfer_id}  │               │
  │                 │                 │◀───────────────│               │
  │                 │                 │                │               │
  │                 │                 │──────────────────────────────▶│
  │                 │                 │ Update payout  │               │
  │                 │                 │ (processing,   │               │
  │                 │                 │  transfer_id)  │               │
  │                 │                 │◀──────────────────────────────│
  │                 │                 │                │               │
  │                 │ {payout_id,     │                │               │
  │                 │  amount_usd,    │                │               │
  │                 │  status}        │                │               │
  │                 │◀────────────────│                │               │
  │                 │                 │                │               │
  │ See pending     │                 │                │               │
  │ payout          │                 │                │               │
  │◀────────────────│                 │                │               │
  │                 │                 │                │               │
  │ ... 1-3 business days ...        │                │               │
  │                 │                 │                │               │
  │                 │                 │ Webhook:       │               │
  │                 │                 │ transfer.      │               │
  │                 │                 │ updated        │               │
  │                 │                 │◀───────────────│               │
  │                 │                 │──────────────────────────────▶│
  │                 │                 │ Update payout (completed)     │
  │                 │                 │ Send notification to creator  │
  │                 │                 │◀──────────────────────────────│
  │                 │                 │                │               │
  │ Email: Payout   │                 │                │               │
  │ of $X received  │                 │                │               │
  │◀─────────────────────────────────│                │               │
```

### 8.4 Affiliate Commission (Affiliate Earns from Referral)

```
New User         Frontend         API Server         DB              Affiliate
  │                 │                 │                │                 │
  │ Visit link:     │                 │                │                 │
  │ sotally.com/    │                 │                │                 │
  │  ?ref=ABC123    │                 │                │                 │
  │────────────────▶│                 │                │                 │
  │                 │ Set cookie:     │                │                 │
  │                 │ ref=ABC123      │                │                 │
  │                 │ (30 day TTL)    │                │                 │
  │◀────────────────│                 │                │                 │
  │                 │                 │                │                 │
  │ Sign up         │                 │                │                 │
  │────────────────▶│                 │                │                 │
  │                 │ POST /auth/     │                │                 │
  │                 │   register      │                │                 │
  │                 │  (ref=ABC123)   │                │                 │
  │                 │────────────────▶│                │                 │
  │                 │                 │                │                 │
  │                 │                 │───────────────▶│                 │
  │                 │                 │ Create user    │                 │
  │                 │                 │ (referred_by)  │                 │
  │                 │                 │ Create         │                 │
  │                 │                 │ affiliate_     │                 │
  │                 │                 │ referral       │                 │
  │                 │                 │ Update         │                 │
  │                 │                 │ affiliate.     │                 │
  │                 │                 │ total_referrals│                 │
  │                 │                 │◀───────────────│                 │
  │                 │                 │                │                 │
  │ ... later, user buys credits ... │                │                 │
  │                 │                 │                │                 │
  │                 │                 │ Webhook:       │                 │
  │                 │                 │ checkout.      │                 │
  │                 │                 │ completed      │                 │
  │                 │                 │                │                 │
  │                 │                 │ Check: is user │                 │
  │                 │                 │ a referral?    │                 │
  │                 │                 │───────────────▶│                 │
  │                 │                 │ Yes: affiliate │                 │
  │                 │                 │ ABC123         │                 │
  │                 │                 │◀───────────────│                 │
  │                 │                 │                │                 │
  │                 │                 │ Calculate      │                 │
  │                 │                 │ commission:    │                 │
  │                 │                 │ $25 * 10%      │                 │
  │                 │                 │ = $2.50        │                 │
  │                 │                 │                │                 │
  │                 │                 │───────────────▶│                 │
  │                 │                 │ Create         │                 │
  │                 │                 │ affiliate_     │                 │
  │                 │                 │ transaction    │                 │
  │                 │                 │ Update         │                 │
  │                 │                 │ affiliate.     │                 │
  │                 │                 │ total_earnings │                 │
  │                 │                 │◀───────────────│                 │
  │                 │                 │                │                 │
  │                 │                 │ Notify         │                 │
  │                 │                 │ affiliate      │                 │
  │                 │                 │─────────────────────────────────▶│
  │                 │                 │                │                 │
  │                 │                 │                │  Email: You     │
  │                 │                 │                │  earned $2.50   │
  │                 │                 │                │  commission     │
  │                 │                 │                │◀────────────────│
```

### 8.5 Subscription Renewal (Automated Billing)

```
Cron/BullMQ       API Server         DB              User
  │                   │                │                │
  │ Scheduled job:    │                │                │
  │ check renewals    │                │                │
  │ (runs every hour) │                │                │
  │──────────────────▶│                │                │
  │                   │                │                │
  │                   │ Query: active  │                │
  │                   │ subscriptions  │                │
  │                   │ WHERE          │                │
  │                   │ next_billing_at│                │
  │                   │ <= NOW()       │                │
  │                   │───────────────▶│                │
  │                   │                │                │
  │                   │ [sub1, sub2...]│                │
  │                   │◀───────────────│                │
  │                   │                │                │
  │                   │ For each subscription:          │
  │                   │                │                │
  │                   │ Check user     │                │
  │                   │ credit_balance │                │
  │                   │───────────────▶│                │
  │                   │                │                │
  │                   │ IF balance >=  │                │
  │                   │ credits_per_mo:│                │
  │                   │                │                │
  │                   │ BEGIN TX:      │                │
  │                   │───────────────▶│                │
  │                   │  Deduct credits│                │
  │                   │  Record credit_│                │
  │                   │  transaction   │                │
  │                   │  Reset runs_   │                │
  │                   │  used = 0      │                │
  │                   │  Update period │                │
  │                   │  dates         │                │
  │                   │  Set next_     │                │
  │                   │  billing_at    │                │
  │                   │  += 1 month    │                │
  │                   │◀───────────────│                │
  │                   │                │                │
  │                   │ Notify user    │                │
  │                   │────────────────────────────────▶│
  │                   │                │                │ Notification:
  │                   │                │                │ "Subscription
  │                   │                │                │  renewed for
  │                   │                │                │  Tool X"
  │                   │                │                │
  │                   │ IF balance <   │                │
  │                   │ credits_per_mo:│                │
  │                   │                │                │
  │                   │───────────────▶│                │
  │                   │  Mark sub as   │                │
  │                   │  status='paused│                │
  │                   │◀───────────────│                │
  │                   │                │                │
  │                   │ Notify user    │                │
  │                   │────────────────────────────────▶│
  │                   │                │                │ Notification:
  │                   │                │                │ "Subscription
  │                   │                │                │  paused -
  │                   │                │                │  insufficient
  │                   │                │                │  credits"
  │                   │                │                │
  │ Job complete      │                │                │
  │◀──────────────────│                │                │
```

---

## Appendix A: Credit-to-USD Conversion

| Direction | Rate | Notes |
|-----------|------|-------|
| Purchase (USD to credits) | $0.10 per credit (base) | Bonus credits reduce effective rate |
| Creator payout (credits to USD) | $0.07 per credit | 70% revenue share (30% platform fee) |
| Affiliate commission | 10% of referred user's USD spend | Paid in USD, not credits |

## Appendix B: Environment Variables

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://sotally.com
NEXTAUTH_SECRET=                     # 64-byte random hex

# Database
DATABASE_URL=postgresql://sotally:PASSWORD@postgres:5432/sotally
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://redis:6379

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Encryption
API_KEY_ENCRYPTION_KEY=              # 32-byte hex for AES-256-GCM

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Monitoring
BETTERSTACK_SOURCE_TOKEN=

# Backup
S3_ENDPOINT=https://fsn1.your-objectstorage.com
S3_BUCKET=sotally-backups
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

## Appendix C: Drizzle ORM Schema File Structure

```
src/
  db/
    schema/
      users.ts
      credit-transactions.ts
      credit-purchases.ts
      tools.ts
      tool-versions.ts
      executions.ts
      categories.ts
      reviews.ts
      api-keys.ts
      creator-profiles.ts
      creator-transactions.ts
      creator-payouts.ts
      tool-subscriptions.ts
      tool-licenses.ts
      tool-templates.ts
      tool-bundles.ts
      tool-reports.ts
      follows.ts
      tool-collections.ts
      affiliates.ts
      affiliate-referrals.ts
      affiliate-transactions.ts
      api-tokens.ts
      notifications.ts
      index.ts              # re-exports all schemas
    migrations/
      0001_initial.sql
    drizzle.config.ts
    client.ts               # connection + pool setup
```

---

**End of Technical Specification.**

---
