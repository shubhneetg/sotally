import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// ─── Mock database ─────────────────────────────────────────────
let queryResults: any[][] = [];
let queryIndex = 0;
let updateResults: any[][] = [];
let updateIndex = 0;

function nextQueryResult() {
  const result = queryResults[queryIndex] ?? [];
  queryIndex++;
  return result;
}

function nextUpdateResult() {
  const result = updateResults[updateIndex] ?? [];
  updateIndex++;
  return result;
}

function makeSelectChain(): any {
  const chain: any = {
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve(nextQueryResult()),
    then: (resolve: any, reject?: any) => Promise.resolve(nextQueryResult()).then(resolve, reject),
  };
  return chain;
}

function makeUpdateChain(): any {
  return {
    set: () => ({
      where: () => ({
        returning: () => Promise.resolve(nextUpdateResult()),
        then: (resolve: any, reject?: any) => Promise.resolve(nextUpdateResult()).then(resolve, reject),
      }),
    }),
  };
}

vi.mock('../../db/client', () => ({
  db: {
    select: () => makeSelectChain(),
    update: () => makeUpdateChain(),
  },
}));

vi.mock('../../db/schema/index', () => ({
  users: {
    id: 'id', name: 'name', bio: 'bio', avatarUrl: 'avatarUrl', bannerUrl: 'bannerUrl',
    niche: 'niche', followerCount: 'followerCount', appCount: 'appCount', createdAt: 'createdAt',
    storefrontSlug: 'storefrontSlug', onboardingComplete: 'onboardingComplete',
    websiteUrl: 'websiteUrl', socialLinks: 'socialLinks', updatedAt: 'updatedAt',
  },
}));

vi.mock('../../lib/env', () => ({
  env: {
    NEXTAUTH_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

// ─── Auth helper ────────────────────────────────────────────────

import { SignJWT } from 'jose';

const TEST_SECRET = new TextEncoder().encode('test-secret-that-is-at-least-32-characters-long');
const TEST_USER = { id: 'user-123', email: 'test@example.com', role: 'creator' };

async function createToken(payload: Record<string, unknown> = {}) {
  return new SignJWT({ email: TEST_USER.email, role: TEST_USER.role, ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub as string || TEST_USER.id)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(TEST_SECRET);
}

// ─── App setup ──────────────────────────────────────────────────

import storefrontRoutes from '../../routes/storefront';

function createApp() {
  const app = new Hono();
  app.route('/storefront', storefrontRoutes);
  return app;
}

describe('Storefront Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults = [];
    queryIndex = 0;
    updateResults = [];
    updateIndex = 0;
  });

  // ─── GET /storefront/check-slug ───────────────────────────────

  describe('GET /storefront/check-slug', () => {
    it('should require authentication', async () => {
      const app = createApp();
      const res = await app.request('/storefront/check-slug?slug=myslug');
      expect(res.status).toBe(401);
    });

    it('should return 400 when slug parameter is missing', async () => {
      const app = createApp();
      const token = await createToken();
      const res = await app.request('/storefront/check-slug', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it('should return available for unused slug', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: no existing user with this slug
      queryResults.push([]);

      const res = await app.request('/storefront/check-slug?slug=mynewstore', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.available).toBe(true);
    });

    it('should return unavailable for reserved slug "admin"', async () => {
      const app = createApp();
      const token = await createToken();

      const res = await app.request('/storefront/check-slug?slug=admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.available).toBe(false);
    });

    it('should return unavailable for reserved slug "api"', async () => {
      const app = createApp();
      const token = await createToken();

      const res = await app.request('/storefront/check-slug?slug=api', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.available).toBe(false);
    });

    it('should return unavailable for reserved slug "dashboard"', async () => {
      const app = createApp();
      const token = await createToken();

      const res = await app.request('/storefront/check-slug?slug=dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.available).toBe(false);
    });

    it('should return unavailable for all reserved slugs', async () => {
      const app = createApp();
      const token = await createToken();
      const reserved = ['admin', 'api', 'app', 'www', 'help', 'support', 'about', 'blog',
        'docs', 'legal', 'terms', 'privacy', 'settings', 'dashboard', 'create',
        'studio', 'onboarding', 'explore', 'search'];

      for (const slug of reserved) {
        const res = await app.request(`/storefront/check-slug?slug=${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json();
        expect(body.data.available).toBe(false);
      }
    });

    it('should return unavailable for slug taken by another user', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: existing user with this slug
      queryResults.push([{ id: 'other-user' }]);

      const res = await app.request('/storefront/check-slug?slug=takenslug', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.available).toBe(false);
    });

    it('should normalize slug to lowercase for reserved check', async () => {
      const app = createApp();
      const token = await createToken();

      const res = await app.request('/storefront/check-slug?slug=ADMIN', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.available).toBe(false);
    });
  });

  // ─── POST /storefront/setup ───────────────────────────────────

  describe('POST /storefront/setup', () => {
    it('should require authentication', async () => {
      const app = createApp();
      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'mystore' }),
      });
      expect(res.status).toBe(401);
    });

    it('should validate slug format - reject slugs starting with hyphen', async () => {
      const app = createApp();
      const token = await createToken();
      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: '-invalid' }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate slug format - reject slugs ending with hyphen', async () => {
      const app = createApp();
      const token = await createToken();
      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: 'invalid-' }),
      });
      expect(res.status).toBe(400);
    });

    it('should validate slug format - reject slugs with uppercase', async () => {
      const app = createApp();
      const token = await createToken();
      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: 'MyStore' }),
      });
      expect(res.status).toBe(400);
    });

    it('should validate slug format - reject slugs with special characters', async () => {
      const app = createApp();
      const token = await createToken();
      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: 'my_store!' }),
      });
      expect(res.status).toBe(400);
    });

    it('should reject slug shorter than 3 characters', async () => {
      const app = createApp();
      const token = await createToken();
      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: 'ab' }),
      });
      expect(res.status).toBe(400);
    });

    it('should reject slug longer than 30 characters', async () => {
      const app = createApp();
      const token = await createToken();
      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: 'a'.repeat(31) }),
      });
      expect(res.status).toBe(400);
    });

    it('should reject reserved slugs with 409', async () => {
      const app = createApp();
      const token = await createToken();
      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: 'admin' }),
      });
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe('CONFLICT');
    });

    it('should reject slug already taken by another user with 409', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: slug taken by another user
      queryResults.push([{ id: 'other-user-456' }]);

      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: 'takenslug' }),
      });
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe('CONFLICT');
      expect(body.error.message).toContain('already taken');
    });

    it('should succeed with valid slug', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: slug not taken
      queryResults.push([]);
      // Update 0: update user
      const updatedUser = {
        id: TEST_USER.id,
        name: 'Test User',
        storefrontSlug: 'mystore',
        bio: null,
        niche: null,
        avatarUrl: null,
        bannerUrl: null,
        onboardingComplete: true,
      };
      updateResults.push([updatedUser]);

      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: 'mystore', bio: 'Hello world', niche: 'fitness' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.storefrontSlug).toBe('mystore');
    });

    it('should accept valid slug with hyphens', async () => {
      const app = createApp();
      const token = await createToken();
      queryResults.push([]);
      updateResults.push([{ id: TEST_USER.id, storefrontSlug: 'my-cool-store' }]);

      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: 'my-cool-store' }),
      });
      expect(res.status).toBe(200);
    });

    it('should allow user to keep their own slug', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: slug found but belongs to the same user
      queryResults.push([{ id: TEST_USER.id }]);
      updateResults.push([{ id: TEST_USER.id, storefrontSlug: 'mystore' }]);

      const res = await app.request('/storefront/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: 'mystore' }),
      });
      expect(res.status).toBe(200);
    });
  });

  // ─── GET /storefront/profile ──────────────────────────────────

  describe('GET /storefront/profile', () => {
    it('should return 400 when slug parameter is missing', async () => {
      const app = createApp();
      const res = await app.request('/storefront/profile');
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it('should return 404 for unknown slug', async () => {
      const app = createApp();
      // Query 0: no user found
      queryResults.push([]);

      const res = await app.request('/storefront/profile?slug=nonexistent');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toContain('Creator not found');
    });

    it('should return creator profile for valid slug', async () => {
      const app = createApp();
      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        bio: 'I build apps',
        avatarUrl: 'https://example.com/avatar.jpg',
        bannerUrl: null,
        niche: 'fitness',
        followerCount: 42,
        appCount: 5,
        createdAt: new Date().toISOString(),
      };
      queryResults.push([mockUser]);

      const res = await app.request('/storefront/profile?slug=johndoe');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('John Doe');
      expect(body.data.bio).toBe('I build apps');
      expect(body.data.appCount).toBe(5);
    });

    it('should not require authentication (public endpoint)', async () => {
      const app = createApp();
      queryResults.push([{ id: 'user-1', name: 'Test' }]);

      const res = await app.request('/storefront/profile?slug=testuser');
      expect(res.status).not.toBe(401);
    });

    it('should include all expected profile fields', async () => {
      const app = createApp();
      const mockUser = {
        id: 'user-1',
        name: 'Jane',
        bio: 'Bio text',
        avatarUrl: null,
        bannerUrl: null,
        niche: 'tech',
        followerCount: 0,
        appCount: 0,
        createdAt: new Date().toISOString(),
      };
      queryResults.push([mockUser]);

      const res = await app.request('/storefront/profile?slug=jane');
      const body = await res.json();
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('name');
      expect(body.data).toHaveProperty('bio');
      expect(body.data).toHaveProperty('niche');
      expect(body.data).toHaveProperty('followerCount');
      expect(body.data).toHaveProperty('appCount');
    });
  });
});
