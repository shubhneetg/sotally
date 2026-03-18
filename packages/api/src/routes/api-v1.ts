import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { apps, appGenerations, appVersions, apiTokens } from '../db/schema/index';
import { generationQueue } from '../lib/queue';
import { env } from '../lib/env';
import { getSourceSnapshot } from '../engine/storage';
import type { Context, Next } from 'hono';
import type { GenerationJobData } from '../engine/types';
import { createHash } from 'crypto';

const apiV1Routes = new Hono();

// ─── API Key Authentication Middleware ──────────────────────────────────────

interface ApiKeyUser {
  id: string;
  tokenId: string;
}

async function apiKeyMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer sk-')) {
    return c.json(
      { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Valid API key required (Bearer sk-xxx)' } },
      401,
    );
  }

  const apiKey = authHeader.slice(7); // Remove 'Bearer '
  const tokenHash = createHash('sha256').update(apiKey).digest('hex');

  const [token] = await db
    .select({
      id: apiTokens.id,
      userId: apiTokens.userId,
      expiresAt: apiTokens.expiresAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.tokenHash, tokenHash))
    .limit(1);

  if (!token) {
    return c.json(
      { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      401,
    );
  }

  // Check expiry
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
    return c.json(
      { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'API key has expired' } },
      401,
    );
  }

  // Update last used timestamp
  await db
    .update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, token.id));

  c.set('apiUser', { id: token.userId, tokenId: token.id } as ApiKeyUser);
  await next();
}

// Apply API key auth to all routes
apiV1Routes.use('*', apiKeyMiddleware);

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

// ─── GET /api/v1/apps — List creator's apps ─────────────────────────────────

apiV1Routes.get('/apps', async (c) => {
  const user = c.get('apiUser') as ApiKeyUser;
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);
  const status = c.req.query('status');

  const conditions: any[] = [eq(apps.creatorId, user.id)];
  if (status) {
    conditions.push(eq(apps.status, status as any));
  }

  const items = await db
    .select({
      id: apps.id,
      slug: apps.slug,
      name: apps.name,
      description: apps.description,
      iconUrl: apps.iconUrl,
      status: apps.status,
      niche: apps.niche,
      totalSessions: apps.totalSessions,
      totalUsers: apps.totalUsers,
      likeCount: apps.likeCount,
      publishedAt: apps.publishedAt,
      createdAt: apps.createdAt,
      updatedAt: apps.updatedAt,
    })
    .from(apps)
    .where(and(...conditions))
    .orderBy(desc(apps.updatedAt))
    .limit(limit)
    .offset(offset);

  return c.json({ success: true, data: items, error: null });
});

// ─── POST /api/v1/apps — Generate an app from prompt ────────────────────────

const createAppSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000),
  niche: z.string().max(100).optional(),
  name: z.string().max(255).optional(),
});

apiV1Routes.post(
  '/apps',
  zValidator('json', createAppSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: result.error.flatten().fieldErrors,
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    const user = c.get('apiUser') as ApiKeyUser;
    const { prompt, niche, name } = c.req.valid('json');

    let slug = generateSlug(name || prompt);
    if (!slug) slug = 'app';

    const [existing] = await db
      .select({ id: apps.id })
      .from(apps)
      .where(and(eq(apps.creatorId, user.id), eq(apps.slug, slug)))
      .limit(1);

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const appName = name || prompt.slice(0, 100).replace(/[.!?].*$/, '') || prompt.slice(0, 100);

    const [app] = await db
      .insert(apps)
      .values({
        creatorId: user.id,
        slug,
        name: appName,
        originalPrompt: prompt,
        status: 'generating',
        niche: niche ?? null,
      })
      .returning();

    const [generation] = await db
      .insert(appGenerations)
      .values({
        appId: app.id,
        creatorId: user.id,
        type: 'initial',
        prompt,
        status: 'queued',
        model: env.GENERATION_MODEL ?? 'default',
      })
      .returning();

    const jobData: GenerationJobData = {
      generationId: generation.id,
      appId: app.id,
      creatorId: user.id,
      prompt,
      type: 'initial',
      niche: niche ?? undefined,
    };

    await generationQueue.add('generate', jobData, { jobId: generation.id });

    return c.json(
      {
        success: true,
        data: { appId: app.id, generationId: generation.id, status: 'generating' },
        error: null,
      },
      202,
    );
  },
);

// ─── GET /api/v1/apps/:id — Get app details ────────────────────────────────

apiV1Routes.get('/apps/:id', async (c) => {
  const user = c.get('apiUser') as ApiKeyUser;
  const appId = c.req.param('id')!;

  const [app] = await db
    .select({
      id: apps.id,
      slug: apps.slug,
      name: apps.name,
      description: apps.description,
      iconUrl: apps.iconUrl,
      niche: apps.niche,
      status: apps.status,
      originalPrompt: apps.originalPrompt,
      currentVersionId: apps.currentVersionId,
      totalSessions: apps.totalSessions,
      totalUsers: apps.totalUsers,
      likeCount: apps.likeCount,
      avgRating: apps.avgRating,
      publishedAt: apps.publishedAt,
      createdAt: apps.createdAt,
      updatedAt: apps.updatedAt,
      creatorId: apps.creatorId,
    })
    .from(apps)
    .where(eq(apps.id, appId))
    .limit(1);

  if (!app) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'App not found' } },
      404,
    );
  }

  if (app.creatorId !== user.id) {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'You do not own this app' } },
      403,
    );
  }

  // Fetch bundle URL from current version
  let bundleUrl = null;
  if (app.currentVersionId) {
    const [version] = await db
      .select({ bundleUrl: appVersions.bundleUrl })
      .from(appVersions)
      .where(eq(appVersions.id, app.currentVersionId))
      .limit(1);
    bundleUrl = version?.bundleUrl ?? null;
  }

  return c.json({
    success: true,
    data: { ...app, bundleUrl },
    error: null,
  });
});

// ─── PATCH /api/v1/apps/:id — Update/iterate app ───────────────────────────

const updateAppSchema = z.object({
  prompt: z.string().min(1).max(2000).optional(),
  name: z.string().max(255).optional(),
  description: z.string().max(500).optional(),
  niche: z.string().max(100).optional(),
});

apiV1Routes.patch(
  '/apps/:id',
  zValidator('json', updateAppSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: result.error.flatten().fieldErrors,
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    const user = c.get('apiUser') as ApiKeyUser;
    const appId = c.req.param('id')!;
    const body = c.req.valid('json');

    const [app] = await db
      .select({
        id: apps.id,
        creatorId: apps.creatorId,
        currentVersionId: apps.currentVersionId,
      })
      .from(apps)
      .where(eq(apps.id, appId))
      .limit(1);

    if (!app) {
      return c.json(
        { success: false, data: null, error: { code: 'NOT_FOUND', message: 'App not found' } },
        404,
      );
    }

    if (app.creatorId !== user.id) {
      return c.json(
        { success: false, data: null, error: { code: 'FORBIDDEN', message: 'You do not own this app' } },
        403,
      );
    }

    // If prompt provided, trigger an iteration
    if (body.prompt) {
      // Fetch existing source
      let existingSource: Record<string, string> | null = null;
      if (app.currentVersionId) {
        const [version] = await db
          .select({ sourceSnapshot: appVersions.sourceSnapshot, versionNumber: appVersions.versionNumber })
          .from(appVersions)
          .where(eq(appVersions.id, app.currentVersionId))
          .limit(1);

        if (version?.sourceSnapshot) {
          const snapshot = version.sourceSnapshot as { files: Record<string, string> };
          existingSource = snapshot.files;
        }

        if (!existingSource && version) {
          const s3Source = await getSourceSnapshot(app.id, version.versionNumber);
          if (s3Source) {
            existingSource = s3Source;
          }
        }
      }

      if (!existingSource || !existingSource['App.tsx']) {
        return c.json(
          { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'No existing source found to iterate on' } },
          400,
        );
      }

      const [generation] = await db
        .insert(appGenerations)
        .values({
          appId: app.id,
          creatorId: user.id,
          type: 'iterate',
          prompt: body.prompt,
          status: 'queued',
          model: env.GENERATION_MODEL ?? 'default',
          systemContext: { previousSource: existingSource },
        })
        .returning();

      await db
        .update(apps)
        .set({ status: 'generating', updatedAt: new Date() })
        .where(eq(apps.id, app.id));

      const jobData: GenerationJobData = {
        generationId: generation.id,
        appId: app.id,
        creatorId: user.id,
        prompt: body.prompt,
        type: 'iterate',
        existingSource,
      };

      await generationQueue.add('iterate', jobData, { jobId: generation.id });

      return c.json(
        {
          success: true,
          data: { generationId: generation.id, status: 'generating' },
          error: null,
        },
        202,
      );
    }

    // Otherwise, update metadata fields
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.niche !== undefined) updateData.niche = body.niche;

    const [updated] = await db
      .update(apps)
      .set(updateData)
      .where(eq(apps.id, appId))
      .returning();

    return c.json({ success: true, data: updated, error: null });
  },
);

// ─── POST /api/v1/apps/:id/publish — Publish an app ────────────────────────

apiV1Routes.post('/apps/:id/publish', async (c) => {
  const user = c.get('apiUser') as ApiKeyUser;
  const appId = c.req.param('id')!;

  const [app] = await db
    .select({
      id: apps.id,
      creatorId: apps.creatorId,
      status: apps.status,
      currentVersionId: apps.currentVersionId,
    })
    .from(apps)
    .where(eq(apps.id, appId))
    .limit(1);

  if (!app) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'App not found' } },
      404,
    );
  }

  if (app.creatorId !== user.id) {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'You do not own this app' } },
      403,
    );
  }

  if (app.status === 'published') {
    return c.json(
      { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'App is already published' } },
      400,
    );
  }

  if (!app.currentVersionId) {
    const [anyVersion] = await db
      .select({ id: appVersions.id })
      .from(appVersions)
      .where(eq(appVersions.appId, appId))
      .limit(1);

    if (!anyVersion) {
      return c.json(
        { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'App must have at least one built version before publishing' } },
        400,
      );
    }
  }

  const now = new Date();

  const [updated] = await db
    .update(apps)
    .set({ status: 'published', publishedAt: now, updatedAt: now })
    .where(eq(apps.id, appId))
    .returning();

  return c.json({ success: true, data: updated, error: null });
});

export default apiV1Routes;
