# Sotally V2 — Deployment Guide

```
Last Updated: 2026-03-18
Target:       Single VPS (0-5K users)
```

---

## Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **VPS** | 4 vCPU, 8 GB RAM | 8 vCPU, 16 GB RAM (Hetzner CPX41) |
| **Storage** | 80 GB NVMe | 240 GB NVMe |
| **OS** | Ubuntu 22.04 / Debian 12 | Ubuntu 24.04 |
| **Docker** | 24.0+ | Latest |
| **Docker Compose** | v2.20+ | Latest |
| **Domain** | A domain you control | sotally.com or equivalent |
| **Stripe** | Stripe account with API keys | Production keys |
| **LLM API** | At least one: Anthropic, OpenAI, Moonshot, or OpenAI-compatible | Anthropic recommended |

---

## 1. DNS Setup

### Required Records

| Record | Host | Value | Purpose |
|--------|------|-------|---------|
| A | `sotally.com` | `<VPS_IP>` | Main domain |
| A | `*.sotally.com` | `<VPS_IP>` | Creator subdomains (wildcard) |
| CNAME | `www` | `sotally.com` | WWW redirect |

The wildcard A record is critical — every creator gets a subdomain like `jane.sotally.com`.

### Optional: Legacy Domain

If migrating from V1 (sotools.com), also add:

| Record | Host | Value |
|--------|------|-------|
| A | `sotools.com` | `<VPS_IP>` |
| A | `*.sotools.com` | `<VPS_IP>` |

---

## 2. Clone and Configure

### Clone the Repository

```bash
git clone https://github.com/your-org/sotally.com.git /opt/sotally
cd /opt/sotally
git checkout feat/v2-platform
```

### Configure Environment

Create the `.env` file at the project root:

```bash
cp .env.example .env   # if example exists, otherwise create from scratch
nano .env
```

### Required Environment Variables

```bash
# ─── Core ────────────────────────────────────────────────────────────────────
NODE_ENV=production
DATABASE_URL=postgresql://sotally:YOUR_DB_PASSWORD@postgres:5432/sotally
REDIS_URL=redis://redis:6379

# ─── Auth ────────────────────────────────────────────────────────────────────
NEXTAUTH_URL=https://sotally.com
NEXTAUTH_SECRET=generate-a-64-char-random-string

# ─── Google OAuth (optional but recommended) ──────────────────────────────────
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# ─── Frontend ────────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://sotally.com/api
FRONTEND_URL=https://sotally.com

# ─── Stripe ──────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# ─── API Key Encryption ─────────────────────────────────────────────────────
API_KEY_ENCRYPTION_KEY=generate-a-32-char-hex-string

# ─── LLM Generation ─────────────────────────────────────────────────────────
# Set at least one API key. Provider auto-detected if GENERATION_PROVIDER not set.
GENERATION_PROVIDER=anthropic           # anthropic | openai | moonshot | openai-compatible
GENERATION_MODEL=                       # leave empty for auto-select, or specify e.g. claude-sonnet-4-20250514
GENERATION_CONCURRENCY=2                # concurrent generation jobs

ANTHROPIC_API_KEY=sk-ant-xxx
# OPENAI_API_KEY=sk-xxx
# MOONSHOT_API_KEY=xxx
# OPENAI_COMPATIBLE_API_KEY=xxx
# OPENAI_COMPATIBLE_BASE_URL=https://api.deepseek.com/v1

# ─── Object Storage (MinIO / S3) ─────────────────────────────────────────────
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=sotally
S3_SECRET_KEY=sotally-secret-key        # CHANGE THIS in production
S3_BUCKET=sotally-apps
S3_REGION=us-east-1
S3_PUBLIC_URL=https://sotally.com/api/apps  # optional: public URL for bundles

# ─── PostgreSQL (used by docker-compose) ─────────────────────────────────────
POSTGRES_DB=sotally
POSTGRES_USER=sotally
POSTGRES_PASSWORD=YOUR_DB_PASSWORD      # match DATABASE_URL above

# ─── MinIO (used by docker-compose) ─────────────────────────────────────────
MINIO_ROOT_USER=sotally
MINIO_ROOT_PASSWORD=sotally-secret-key  # CHANGE THIS in production
```

### Generate Secrets

```bash
# NEXTAUTH_SECRET
openssl rand -base64 48

# API_KEY_ENCRYPTION_KEY
openssl rand -hex 16

# POSTGRES_PASSWORD
openssl rand -base64 24
```

---

## 3. Docker Compose Architecture

The production stack runs 7 containers:

```
┌─────────────┐
│    Caddy     │ :80, :443 — reverse proxy, auto TLS
└──────┬───┬──┘
       │   │
  ┌────▼┐ ┌▼────┐
  │ Web │ │ API │  Next.js :3000, Hono :4000
  └─────┘ └──┬──┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼──┐ ┌───▼──┐ ┌───▼────┐
│ PG16 │ │Redis │ │ MinIO  │  Data layer
└──────┘ └──────┘ └────────┘

┌──────────────────┐  ┌──────────────────────┐
│  Worker (V1)     │  │  Generation Worker   │  Background jobs
│  Execution queue │  │  App generation (V2) │
└──────────────────┘  └──────────────────────┘
```

---

## 4. Build and Start

### First-Time Setup

```bash
cd /opt/sotally

# Build all images
docker compose build

# Start the stack
docker compose up -d

# Verify all containers are running
docker compose ps
```

Expected containers:
- `caddy` — healthy
- `web` — running
- `api` — running
- `worker` — running
- `generation-worker` — running
- `postgres` — healthy
- `redis` — healthy
- `minio` — healthy

### Initialize the Database

```bash
# Push the Drizzle schema to PostgreSQL
docker compose exec api npx drizzle-kit push

# (Optional) Create an admin user
docker compose exec api npx tsx src/scripts/create-admin.ts
```

### Seed Demo Data (Optional)

```bash
# Run the seed script for demo apps
node scripts/seed-apps.mjs
```

---

## 5. Verify

### Health Check

```bash
curl https://sotally.com/api/health
```

Expected response:
```json
{ "status": "ok" }
```

### Verify Main Domain

Open `https://sotally.com` in a browser. You should see the Next.js frontend.

### Verify Subdomain Routing

Open `https://anyname.sotally.com` — should route through to Next.js (which handles subdomain resolution via middleware).

### Verify API

```bash
curl https://sotally.com/api/apps/explore
```

Should return a JSON response with `success: true`.

### Verify MinIO

The MinIO console is exposed on port 9001 (development only):

```bash
curl http://localhost:9001
```

In production, remove the `ports` mapping for 9001 in `docker-compose.yml`.

---

## 6. SSL / TLS

Caddy handles TLS automatically:

- **Main domain**: Standard Let's Encrypt certificate
- **Subdomains**: On-demand TLS (`tls { on_demand }`) — certificates are issued when the first request arrives for a new subdomain
- **Custom domains**: Also on-demand TLS — Caddy auto-provisions certificates when creators point their domains to the server

No manual certificate management is needed. Caddy stores certificates in the `caddy_data` volume.

### Caddyfile Overview

The Caddyfile configures three server blocks:

1. `sotally.com` — Main domain, routes `/api/*` to Hono, everything else to Next.js
2. `*.sotally.com` — Creator subdomains, same routing, on-demand TLS
3. `*.sotools.com`, `sotools.com` — Legacy V1 compatibility

Security headers are applied globally:
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- Server header stripped
- Gzip compression enabled

---

## 7. Monitoring and Maintenance

### Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f generation-worker

# Last 100 lines
docker compose logs --tail 100 api
```

### Database Backups

Set up automated PostgreSQL backups:

```bash
# Manual backup
docker compose exec postgres pg_dump -U sotally sotally > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T postgres psql -U sotally sotally < backup.sql
```

Recommended: cron job for daily backups with offsite storage.

### Resource Limits

The generation worker has resource limits configured in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
```

Adjust based on your VPS capacity and generation concurrency.

### Updating

```bash
cd /opt/sotally
git pull origin feat/v2-platform
docker compose build
docker compose up -d

# If schema changed:
docker compose exec api npx drizzle-kit push
```

### Redis Configuration

Redis is configured with:
- Append-only file persistence
- 256 MB memory limit
- `allkeys-lru` eviction policy

Adjust in `docker-compose.yml` if needed.

---

## 8. Scaling (Future)

### Phase 2: 5K-50K Users

- Move PostgreSQL to Hetzner managed database
- Add a second VPS for generation workers
- Increase generation concurrency
- Add Redis Sentinel or managed Redis

### Phase 3: 50K+ Users

- Load balancer (Hetzner LB or Caddy clustering)
- Multiple API nodes
- Dedicated worker fleet
- PostgreSQL read replicas
- CDN for static assets and app bundles (Cloudflare / BunnyCDN)

---

## Troubleshooting

### Container Won't Start

```bash
docker compose logs <service-name>
```

Common issues:
- Missing `.env` variables — check all required vars are set
- Port conflicts — ensure 80/443 aren't used by another service
- Database not ready — the `depends_on` with healthcheck should handle this, but check pg logs

### Generation Failing

```bash
docker compose logs generation-worker
```

Check:
- LLM API key is valid and has credits
- `GENERATION_PROVIDER` matches the API key you provided
- S3/MinIO is healthy and the bucket exists

### SSL Certificate Issues

```bash
docker compose logs caddy
```

Caddy auto-provisions certificates. If failing:
- Verify DNS A records point to the server IP
- Ensure ports 80 and 443 are open in firewall
- Check rate limits if using Let's Encrypt staging

### Database Schema Issues

```bash
# Check current schema state
docker compose exec api npx drizzle-kit studio

# Force push schema (destructive in production — backup first)
docker compose exec api npx drizzle-kit push --force
```
