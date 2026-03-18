import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { apps, appGenerations, appVersions, users } from '../db/schema/index';
import { authMiddleware, optionalAuthMiddleware, type AuthUser } from '../middleware/auth';
import { generationQueue } from '../lib/queue';
import { env } from '../lib/env';
import { getSourceSnapshot } from '../engine/storage';
import type { GenerationJobData } from '../engine/types';

const appRoutes = new Hono();

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

// ─── POST /apps/generate — Create app from prompt ──────────────────────────

const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt must be under 2000 characters'),
  niche: z.string().max(100).optional(),
});

appRoutes.post(
  '/generate',
  authMiddleware,
  zValidator('json', generateSchema, (result, c) => {
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
    const user = c.get('user') as AuthUser;
    const { prompt, niche } = c.req.valid('json');

    // Generate a slug from the prompt
    let slug = generateSlug(prompt);
    if (!slug) slug = 'app';

    // Ensure slug uniqueness for this creator by appending a random suffix
    const [existing] = await db
      .select({ id: apps.id })
      .from(apps)
      .where(and(eq(apps.creatorId, user.id), eq(apps.slug, slug)))
      .limit(1);

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Create app record
    const [app] = await db
      .insert(apps)
      .values({
        creatorId: user.id,
        slug,
        name: prompt.slice(0, 255),
        originalPrompt: prompt,
        status: 'generating',
        niche: niche ?? null,
      })
      .returning();

    // Create generation record
    const [generation] = await db
      .insert(appGenerations)
      .values({
        appId: app.id,
        creatorId: user.id,
        type: 'initial',
        prompt,
        status: 'queued',
        model: env.GENERATION_MODEL,
      })
      .returning();

    // Enqueue generation job
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
        data: { appId: app.id, generationId: generation.id },
        error: null,
      },
      202,
    );
  },
);

// ─── POST /apps/:id/iterate — Iterate on an existing app ───────────────────

const iterateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000),
});

appRoutes.post(
  '/:id/iterate',
  authMiddleware,
  zValidator('json', iterateSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.flatten().fieldErrors },
        },
        400,
      );
    }
  }),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const appId = c.req.param('id')!;
    const { prompt } = c.req.valid('json');

    // Fetch app and verify ownership
    const [app] = await db
      .select({ id: apps.id, creatorId: apps.creatorId, currentVersionId: apps.currentVersionId })
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

    // Fetch latest version source snapshot for context
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

      // Fallback: try S3 source snapshot
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

    // Create generation record
    const [generation] = await db
      .insert(appGenerations)
      .values({
        appId: app.id,
        creatorId: user.id,
        type: 'iterate',
        prompt,
        status: 'queued',
        model: env.GENERATION_MODEL,
        systemContext: { previousSource: existingSource },
      })
      .returning();

    // Update app status to generating
    await db
      .update(apps)
      .set({ status: 'generating', updatedAt: new Date() })
      .where(eq(apps.id, app.id));

    // Enqueue iteration job
    const jobData: GenerationJobData = {
      generationId: generation.id,
      appId: app.id,
      creatorId: user.id,
      prompt,
      type: 'iterate',
      existingSource,
    };

    await generationQueue.add('iterate', jobData, { jobId: generation.id });

    return c.json(
      {
        success: true,
        data: { generationId: generation.id },
        error: null,
      },
      202,
    );
  },
);

// ─── GET /apps/my — List authenticated user's apps ──────────────────────────

appRoutes.get('/my', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;

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
      generationCount: apps.generationCount,
      publishedAt: apps.publishedAt,
      createdAt: apps.createdAt,
      updatedAt: apps.updatedAt,
    })
    .from(apps)
    .where(eq(apps.creatorId, user.id))
    .orderBy(desc(apps.updatedAt));

  return c.json({ success: true, data: items, error: null });
});

// ─── GET /apps/by-creator — Public: list published apps by creator slug ─────

appRoutes.get('/by-creator', async (c) => {
  const slug = c.req.query('slug');

  if (!slug) {
    return c.json(
      { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'slug query parameter is required' } },
      400,
    );
  }

  // Look up creator by storefront slug
  const [creator] = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.storefrontSlug, slug))
    .limit(1);

  if (!creator) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Creator not found' } },
      404,
    );
  }

  const items = await db
    .select({
      id: apps.id,
      slug: apps.slug,
      name: apps.name,
      description: apps.description,
      iconUrl: apps.iconUrl,
      niche: apps.niche,
      totalSessions: apps.totalSessions,
      likeCount: apps.likeCount,
      avgRating: apps.avgRating,
      publishedAt: apps.publishedAt,
    })
    .from(apps)
    .where(and(eq(apps.creatorId, creator.id), eq(apps.status, 'published')))
    .orderBy(desc(apps.publishedAt));

  return c.json({ success: true, data: items, error: null });
});

// ─── GET /apps/by-slug — Public: look up app by creator + app slug ──────────

appRoutes.get('/by-slug', async (c) => {
  const creatorSlug = c.req.query('creator');
  const appSlug = c.req.query('slug');

  if (!creatorSlug || !appSlug) {
    return c.json(
      { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'creator and slug query parameters are required' } },
      400,
    );
  }

  // Look up creator
  const [creator] = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, storefrontSlug: users.storefrontSlug })
    .from(users)
    .where(eq(users.storefrontSlug, creatorSlug))
    .limit(1);

  if (!creator) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Creator not found' } },
      404,
    );
  }

  // Look up app
  const [app] = await db
    .select({
      id: apps.id,
      slug: apps.slug,
      name: apps.name,
      description: apps.description,
      longDescription: apps.longDescription,
      iconUrl: apps.iconUrl,
      screenshotUrls: apps.screenshotUrls,
      niche: apps.niche,
      tags: apps.tags,
      pricingModel: apps.pricingModel,
      requiresAuth: apps.requiresAuth,
      hasAiFeatures: apps.hasAiFeatures,
      totalSessions: apps.totalSessions,
      totalUsers: apps.totalUsers,
      likeCount: apps.likeCount,
      avgRating: apps.avgRating,
      reviewCount: apps.reviewCount,
      currentVersionId: apps.currentVersionId,
      status: apps.status,
      publishedAt: apps.publishedAt,
      createdAt: apps.createdAt,
    })
    .from(apps)
    .where(and(eq(apps.creatorId, creator.id), eq(apps.slug, appSlug)))
    .limit(1);

  if (!app || (app.status !== 'published' && app.status !== 'unlisted')) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'App not found' } },
      404,
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
    data: {
      ...app,
      bundleUrl,
      creator: {
        id: creator.id,
        name: creator.name,
        avatarUrl: creator.avatarUrl,
        storefrontSlug: creator.storefrontSlug,
      },
    },
    error: null,
  });
});

// ─── GET /apps/:id — Get app details ────────────────────────────────────────

appRoutes.get('/:id', optionalAuthMiddleware, async (c) => {
  const appId = c.req.param('id')!;

  const [app] = await db
    .select({
      id: apps.id,
      slug: apps.slug,
      name: apps.name,
      description: apps.description,
      longDescription: apps.longDescription,
      iconUrl: apps.iconUrl,
      screenshotUrls: apps.screenshotUrls,
      niche: apps.niche,
      tags: apps.tags,
      originalPrompt: apps.originalPrompt,
      pricingModel: apps.pricingModel,
      requiresAuth: apps.requiresAuth,
      hasAiFeatures: apps.hasAiFeatures,
      totalSessions: apps.totalSessions,
      totalUsers: apps.totalUsers,
      likeCount: apps.likeCount,
      avgRating: apps.avgRating,
      reviewCount: apps.reviewCount,
      currentVersionId: apps.currentVersionId,
      status: apps.status,
      isFeatured: apps.isFeatured,
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

  // Fetch creator info
  const [creator] = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, storefrontSlug: users.storefrontSlug })
    .from(users)
    .where(eq(users.id, app.creatorId))
    .limit(1);

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
    data: {
      ...app,
      bundleUrl,
      creator: creator || null,
    },
    error: null,
  });
});

// ─── GET /apps/:id/bundle — Redirect to app bundle ─────────────────────────

appRoutes.get('/:id/bundle', async (c) => {
  const appId = c.req.param('id')!;

  const [app] = await db
    .select({ currentVersionId: apps.currentVersionId })
    .from(apps)
    .where(eq(apps.id, appId))
    .limit(1);

  if (!app || !app.currentVersionId) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'App bundle not found' } },
      404,
    );
  }

  const [version] = await db
    .select({ bundleUrl: appVersions.bundleUrl })
    .from(appVersions)
    .where(eq(appVersions.id, app.currentVersionId))
    .limit(1);

  if (!version?.bundleUrl) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Bundle not available' } },
      404,
    );
  }

  c.header('Cache-Control', 'public, max-age=3600, immutable');
  return c.redirect(version.bundleUrl, 302);
});

// ─── POST /apps/:id/publish — Publish an app ───────────────────────────────

appRoutes.post('/:id/publish', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
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

  // Verify app has at least one version
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

  // Increment creator's appCount
  await db
    .update(users)
    .set({
      appCount: sql`${users.appCount} + 1`,
      updatedAt: now,
    })
    .where(eq(users.id, user.id));

  return c.json({ success: true, data: updated, error: null });
});

// ─── GET /apps/:id/status — Generation status (polling) ────────────────────

appRoutes.get('/:id/status', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const appId = c.req.param('id')!;

  // Verify ownership
  const [app] = await db
    .select({ id: apps.id, creatorId: apps.creatorId, status: apps.status })
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

  // Fetch latest generation record
  const [generation] = await db
    .select({
      id: appGenerations.id,
      type: appGenerations.type,
      status: appGenerations.status,
      errorMessage: appGenerations.errorMessage,
      errorCode: appGenerations.errorCode,
      queuedAt: appGenerations.queuedAt,
      startedAt: appGenerations.startedAt,
      completedAt: appGenerations.completedAt,
      durationMs: appGenerations.durationMs,
    })
    .from(appGenerations)
    .where(eq(appGenerations.appId, appId))
    .orderBy(desc(appGenerations.queuedAt))
    .limit(1);

  return c.json({
    success: true,
    data: {
      appStatus: app.status,
      generation: generation || null,
    },
    error: null,
  });
});

// ─── GET /apps/:id/generations — Generation history ─────────────────────────

appRoutes.get('/:id/generations', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const appId = c.req.param('id')!;

  // Verify ownership
  const [app] = await db
    .select({ creatorId: apps.creatorId })
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
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      403,
    );
  }

  const generations = await db
    .select({
      id: appGenerations.id,
      type: appGenerations.type,
      prompt: appGenerations.prompt,
      status: appGenerations.status,
      model: appGenerations.model,
      inputTokens: appGenerations.inputTokens,
      outputTokens: appGenerations.outputTokens,
      totalTokens: appGenerations.totalTokens,
      errorMessage: appGenerations.errorMessage,
      errorCode: appGenerations.errorCode,
      durationMs: appGenerations.durationMs,
      queuedAt: appGenerations.queuedAt,
      startedAt: appGenerations.startedAt,
      completedAt: appGenerations.completedAt,
    })
    .from(appGenerations)
    .where(eq(appGenerations.appId, appId))
    .orderBy(desc(appGenerations.queuedAt));

  return c.json({ success: true, data: generations, error: null });
});

export default appRoutes;
