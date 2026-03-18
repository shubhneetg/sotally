import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// ─── Mock database ─────────────────────────────────────────────
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockReturning = vi.fn();
const mockSet = vi.fn();

function resetDbChain() {
  mockLimit.mockResolvedValue([]);
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });

  mockReturning.mockResolvedValue([]);
  mockSet.mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) });
  mockUpdate.mockReturnValue({ set: mockSet });
}

vi.mock('../../db/client', () => ({
  db: {
    select: (...args: any[]) => mockSelect(...args),
    update: (...args: any[]) => mockUpdate(...args),
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
    resetDbChain();
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
      // Mock: no existing user with this slug
      mockLimit.mockResolvedValueOnce([]);

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

    it('should return unavailable for slug taken by another user', async () => {
      const app = createApp();
      const token = await createToken();
      // Mock: existing user with this slug
      mockLimit.mockResolvedValueOnce([{ id: 'other-user' }]);

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
      // Reserved slugs pass zod validation but get caught in the handler
      // "admin" is 5 chars, lowercase, no hyphens at edges — passes regex
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe('CONFLICT');
    });

    it('should reject slug already taken by another user with 409', async () => {
      const app = createApp();
      const token = await createToken();
      // Mock: slug taken by another user
      mockLimit.mockResolvedValueOnce([{ id: 'other-user-456' }]);

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
      // Mock: slug not taken
      mockLimit.mockResolvedValueOnce([]);
      // Mock: update returns updated user
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
      mockSet.mockReturnValueOnce({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedUser]),
        }),
      });

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
      mockLimit.mockResolvedValueOnce([]);
      mockSet.mockReturnValueOnce({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: TEST_USER.id, storefrontSlug: 'my-cool-store' }]),
        }),
      });

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
      // Mock: no user found
      mockLimit.mockResolvedValueOnce([]);

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
      mockLimit.mockResolvedValueOnce([mockUser]);

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
      mockLimit.mockResolvedValueOnce([{ id: 'user-1', name: 'Test' }]);

      const res = await app.request('/storefront/profile?slug=testuser');
      // Should not return 401
      expect(res.status).not.toBe(401);
    });
  });
});
