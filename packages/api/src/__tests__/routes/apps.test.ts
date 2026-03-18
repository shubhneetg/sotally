import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// ─── Mock database ─────────────────────────────────────────────
// Build a chainable mock that supports any order of .select().from().where().orderBy().limit()
// Each call to the terminal method (.limit() or the final in chain) resolves with queryResults[queryIndex++].

let queryResults: any[][] = [];
let queryIndex = 0;
let insertResults: any[][] = [];
let insertIndex = 0;
let updateResults: any[][] = [];
let updateIndex = 0;

function nextQueryResult() {
  const result = queryResults[queryIndex] ?? [];
  queryIndex++;
  return result;
}

function nextInsertResult() {
  const result = insertResults[insertIndex] ?? [];
  insertIndex++;
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

function makeInsertChain(): any {
  return {
    values: () => ({
      returning: () => Promise.resolve(nextInsertResult()),
    }),
  };
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
    insert: () => makeInsertChain(),
    update: () => makeUpdateChain(),
  },
}));

vi.mock('../../db/schema/index', () => ({
  apps: { id: 'id', slug: 'slug', name: 'name', creatorId: 'creatorId', status: 'status', currentVersionId: 'currentVersionId', description: 'description', iconUrl: 'iconUrl', niche: 'niche', totalSessions: 'totalSessions', totalUsers: 'totalUsers', likeCount: 'likeCount', avgRating: 'avgRating', generationCount: 'generationCount', publishedAt: 'publishedAt', createdAt: 'createdAt', updatedAt: 'updatedAt', longDescription: 'longDescription', screenshotUrls: 'screenshotUrls', tags: 'tags', pricingModel: 'pricingModel', requiresAuth: 'requiresAuth', hasAiFeatures: 'hasAiFeatures', reviewCount: 'reviewCount', isFeatured: 'isFeatured', originalPrompt: 'originalPrompt' },
  appGenerations: { id: 'id', appId: 'appId', creatorId: 'creatorId', type: 'type', prompt: 'prompt', status: 'status', model: 'model', errorMessage: 'errorMessage', errorCode: 'errorCode', queuedAt: 'queuedAt', startedAt: 'startedAt', completedAt: 'completedAt', durationMs: 'durationMs', inputTokens: 'inputTokens', outputTokens: 'outputTokens', totalTokens: 'totalTokens', systemContext: 'systemContext' },
  appVersions: { id: 'id', appId: 'appId', bundleUrl: 'bundleUrl', sourceSnapshot: 'sourceSnapshot', versionNumber: 'versionNumber' },
  users: { id: 'id', name: 'name', avatarUrl: 'avatarUrl', storefrontSlug: 'storefrontSlug', appCount: 'appCount', updatedAt: 'updatedAt' },
}));

vi.mock('../../lib/queue', () => ({
  generationQueue: { add: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../lib/env', () => ({
  env: {
    NEXTAUTH_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    GENERATION_MODEL: 'claude-test',
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

vi.mock('../../engine/storage', () => ({
  getSourceSnapshot: vi.fn().mockResolvedValue(null),
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

import appRoutes from '../../routes/apps';

function createApp() {
  const app = new Hono();
  app.route('/apps', appRoutes);
  return app;
}

describe('App Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults = [];
    queryIndex = 0;
    insertResults = [];
    insertIndex = 0;
    updateResults = [];
    updateIndex = 0;
  });

  // ─── POST /apps/generate ──────────────────────────────────────

  describe('POST /apps/generate', () => {
    it('should require authentication (401 without token)', async () => {
      const app = createApp();
      const res = await app.request('/apps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Build a counter app' }),
      });
      expect(res.status).toBe(401);
      const body: any = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject empty prompt', async () => {
      const app = createApp();
      const token = await createToken();
      const res = await app.request('/apps/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: '' }),
      });
      expect(res.status).toBe(400);
      const body: any = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject prompt exceeding 2000 characters', async () => {
      const app = createApp();
      const token = await createToken();
      const longPrompt = 'a'.repeat(2001);
      const res = await app.request('/apps/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: longPrompt }),
      });
      expect(res.status).toBe(400);
      const body: any = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid prompt and return 202 with appId', async () => {
      const app = createApp();
      const token = await createToken();

      // Query 0: check slug collision
      queryResults.push([]);
      // Insert 0: create app
      insertResults.push([{ id: 'app-new', slug: 'build-a-counter-app' }]);
      // Insert 1: create generation
      insertResults.push([{ id: 'gen-1' }]);

      const res = await app.request('/apps/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: 'Build a counter app' }),
      });
      expect(res.status).toBe(202);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('appId');
      expect(body.data).toHaveProperty('generationId');
    });

    it('should reject request with missing body', async () => {
      const app = createApp();
      const token = await createToken();
      const res = await app.request('/apps/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it('should accept prompt at exactly 2000 characters', async () => {
      const app = createApp();
      const token = await createToken();

      queryResults.push([]);
      insertResults.push([{ id: 'app-new', slug: 'a-long-prompt' }]);
      insertResults.push([{ id: 'gen-1' }]);

      const res = await app.request('/apps/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: 'a'.repeat(2000) }),
      });
      expect(res.status).toBe(202);
    });
  });

  // ─── GET /apps/by-creator ─────────────────────────────────────

  describe('GET /apps/by-creator', () => {
    it('should return 400 when slug parameter is missing', async () => {
      const app = createApp();
      const res = await app.request('/apps/by-creator');
      expect(res.status).toBe(400);
      const body: any = await res.json();
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it('should return 404 when creator is not found', async () => {
      const app = createApp();
      // Query 0: creator lookup returns empty
      queryResults.push([]);

      const res = await app.request('/apps/by-creator?slug=unknown-creator');
      expect(res.status).toBe(404);
      const body: any = await res.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return published apps for valid creator', async () => {
      const app = createApp();
      const mockApps = [
        { id: 'app-1', slug: 'counter', name: 'Counter App', description: 'A counter', publishedAt: new Date() },
        { id: 'app-2', slug: 'todo', name: 'Todo App', description: 'A todo list', publishedAt: new Date() },
      ];

      // Query 0: creator found
      queryResults.push([{ id: 'user-1', name: 'John', avatarUrl: null }]);
      // Query 1: published apps (uses .orderBy() as terminal -- resolved via .then)
      queryResults.push(mockApps);

      const res = await app.request('/apps/by-creator?slug=john');
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].slug).toBe('counter');
    });

    it('should not require authentication', async () => {
      const app = createApp();
      queryResults.push([{ id: 'user-1', name: 'John', avatarUrl: null }]);
      queryResults.push([]);

      const res = await app.request('/apps/by-creator?slug=john');
      expect(res.status).toBe(200);
    });
  });

  // ─── GET /apps/:id/status ─────────────────────────────────────

  describe('GET /apps/:id/status', () => {
    it('should require authentication', async () => {
      const app = createApp();
      const res = await app.request('/apps/app-123/status');
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent app', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: app not found
      queryResults.push([]);

      const res = await app.request('/apps/app-999/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(404);
    });

    it('should return 403 if user does not own the app', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: app found but owned by other user
      queryResults.push([{ id: 'app-123', creatorId: 'other-user', status: 'generating' }]);

      const res = await app.request('/apps/app-123/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(403);
    });

    it('should return generation status for owned app', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: app found, owned by test user
      queryResults.push([{ id: 'app-123', creatorId: TEST_USER.id, status: 'generating' }]);
      // Query 1: latest generation record
      queryResults.push([{
        id: 'gen-1',
        type: 'initial',
        status: 'processing',
        errorMessage: null,
        errorCode: null,
        queuedAt: new Date(),
        startedAt: new Date(),
        completedAt: null,
        durationMs: null,
      }]);

      const res = await app.request('/apps/app-123/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.appStatus).toBe('generating');
      expect(body.data.generation).toBeTruthy();
      expect(body.data.generation.status).toBe('processing');
    });

    it('should return null generation when none exists', async () => {
      const app = createApp();
      const token = await createToken();
      queryResults.push([{ id: 'app-123', creatorId: TEST_USER.id, status: 'draft' }]);
      queryResults.push([]); // no generation records

      const res = await app.request('/apps/app-123/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data.generation).toBeNull();
    });
  });

  // ─── POST /apps/:id/publish ───────────────────────────────────

  describe('POST /apps/:id/publish', () => {
    it('should require authentication', async () => {
      const app = createApp();
      const res = await app.request('/apps/app-123/publish', { method: 'POST' });
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent app', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: app not found
      queryResults.push([]);

      const res = await app.request('/apps/app-123/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(404);
    });

    it('should return 403 if user does not own the app', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: app found, owned by other user
      queryResults.push([{ id: 'app-123', creatorId: 'other-user', status: 'draft', currentVersionId: 'v1' }]);

      const res = await app.request('/apps/app-123/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(403);
    });

    it('should return 400 if app is already published', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: app found, already published
      queryResults.push([{ id: 'app-123', creatorId: TEST_USER.id, status: 'published', currentVersionId: 'v1' }]);

      const res = await app.request('/apps/app-123/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(400);
      const body: any = await res.json();
      expect(body.error.message).toContain('already published');
    });

    it('should change status to published for valid draft app', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: app found, draft, owned by user, has version
      queryResults.push([{ id: 'app-123', creatorId: TEST_USER.id, status: 'draft', currentVersionId: 'v1' }]);
      // Update 0: update app status
      const updatedApp = { id: 'app-123', status: 'published', publishedAt: new Date() };
      updateResults.push([updatedApp]);
      // Update 1: increment user appCount (no returning, consumed via then)
      updateResults.push([]);

      const res = await app.request('/apps/app-123/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('published');
    });

    it('should return 400 if app has no version and no currentVersionId', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: app found, no currentVersionId
      queryResults.push([{ id: 'app-123', creatorId: TEST_USER.id, status: 'draft', currentVersionId: null }]);
      // Query 1: check for any version -- none exist
      queryResults.push([]);

      const res = await app.request('/apps/app-123/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(400);
      const body: any = await res.json();
      expect(body.error.message).toContain('at least one built version');
    });

    it('should publish if no currentVersionId but a version exists', async () => {
      const app = createApp();
      const token = await createToken();
      // Query 0: app found, no currentVersionId
      queryResults.push([{ id: 'app-123', creatorId: TEST_USER.id, status: 'draft', currentVersionId: null }]);
      // Query 1: a version exists
      queryResults.push([{ id: 'v1' }]);
      // Update 0: update app
      updateResults.push([{ id: 'app-123', status: 'published' }]);
      // Update 1: increment appCount
      updateResults.push([]);

      const res = await app.request('/apps/app-123/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
    });
  });
});
