import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { apps, appGenerations } from '../db/schema/index';
import { authMiddleware, optionalAuthMiddleware, type AuthUser } from '../middleware/auth';
import { generationQueue } from '../lib/queue';
import { env } from '../lib/env';
import type { GenerationJobData } from '../engine/types';

const templateRoutes = new Hono();

// ─── POST /templates — Save an app as a template ────────────────────────────

const createTemplateSchema = z.object({
  appId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  niche: z.string().max(100).optional(),
  priceCents: z.number().int().min(0).default(0),
});

templateRoutes.post(
  '/',
  authMiddleware,
  zValidator('json', createTemplateSchema, (result, c) => {
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
    const { appId, title, description, niche, priceCents } = c.req.valid('json');

    // Verify app ownership
    const [app] = await db
      .select({ id: apps.id, creatorId: apps.creatorId, originalPrompt: apps.originalPrompt })
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

    // Build prompt chain from generation history
    const generations = await db
      .select({
        type: appGenerations.type,
        prompt: appGenerations.prompt,
        status: appGenerations.status,
      })
      .from(appGenerations)
      .where(and(eq(appGenerations.appId, appId), eq(appGenerations.status, 'succeeded')))
      .orderBy(appGenerations.queuedAt);

    const promptChain = generations.map((g) => ({
      type: g.type,
      prompt: g.prompt,
    }));

    // Fallback: ensure at least the original prompt is in the chain
    if (promptChain.length === 0) {
      promptChain.push({ type: 'initial', prompt: app.originalPrompt });
    }

    // Insert template via raw SQL (table managed inline)
    const [template] = (
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          app_id UUID REFERENCES apps(id),
          creator_id UUID NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          description TEXT,
          niche TEXT,
          price_cents INTEGER DEFAULT 0,
          use_count INTEGER DEFAULT 0,
          prompt_chain JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
    ).rows as any[];

    const result = await db.execute(sql`
      INSERT INTO templates (app_id, creator_id, title, description, niche, price_cents, prompt_chain)
      VALUES (${appId}, ${user.id}, ${title}, ${description ?? null}, ${niche ?? null}, ${priceCents}, ${JSON.stringify(promptChain)}::jsonb)
      RETURNING *
    `);

    return c.json({ success: true, data: result.rows[0], error: null }, 201);
  },
);

// ─── GET /templates — Browse templates ──────────────────────────────────────

templateRoutes.get('/', async (c) => {
  const niche = c.req.query('niche');
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const nicheFilter = niche ? sql`AND t.niche = ${niche}` : sql``;

  const result = await db.execute(sql`
    SELECT
      t.id, t.app_id, t.creator_id, t.title, t.description,
      t.niche, t.price_cents, t.use_count, t.created_at,
      u.name AS creator_name, u.avatar_url AS creator_avatar_url
    FROM templates t
    LEFT JOIN users u ON t.creator_id = u.id
    WHERE 1=1 ${nicheFilter}
    ORDER BY t.use_count DESC, t.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return c.json({ success: true, data: result.rows, error: null });
});

// ─── GET /templates/:id — Template detail ───────────────────────────────────

templateRoutes.get('/:id', async (c) => {
  const templateId = c.req.param('id')!;

  const result = await db.execute(sql`
    SELECT
      t.id, t.app_id, t.creator_id, t.title, t.description,
      t.niche, t.price_cents, t.use_count, t.prompt_chain, t.created_at,
      u.name AS creator_name, u.avatar_url AS creator_avatar_url
    FROM templates t
    LEFT JOIN users u ON t.creator_id = u.id
    WHERE t.id = ${templateId}
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Template not found' } },
      404,
    );
  }

  return c.json({ success: true, data: result.rows[0], error: null });
});

// ─── POST /templates/:id/use — Clone template to create a new app ───────────

templateRoutes.post('/:id/use', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const templateId = c.req.param('id')!;

  // Fetch template
  const result = await db.execute(sql`
    SELECT id, app_id, prompt_chain, title, niche
    FROM templates
    WHERE id = ${templateId}
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Template not found' } },
      404,
    );
  }

  const template = result.rows[0] as {
    id: string;
    app_id: string;
    prompt_chain: Array<{ type: string; prompt: string }>;
    title: string;
    niche: string | null;
  };

  const promptChain = template.prompt_chain;
  const initialPrompt = promptChain[0]?.prompt;

  if (!initialPrompt) {
    return c.json(
      { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'Template has no prompts' } },
      400,
    );
  }

  // Generate slug from template title
  let slug = template.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);

  if (!slug) slug = 'app';

  // Ensure slug uniqueness
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
      name: template.title,
      originalPrompt: initialPrompt,
      status: 'generating',
      niche: template.niche ?? null,
    })
    .returning();

  // Create generation record for initial prompt
  const [generation] = await db
    .insert(appGenerations)
    .values({
      appId: app.id,
      creatorId: user.id,
      type: 'initial',
      prompt: initialPrompt,
      status: 'queued',
      model: env.GENERATION_MODEL,
      systemContext: { fromTemplate: templateId, promptChain },
    })
    .returning();

  // Enqueue generation job
  const jobData: GenerationJobData = {
    generationId: generation.id,
    appId: app.id,
    creatorId: user.id,
    prompt: initialPrompt,
    type: 'initial',
    niche: template.niche ?? undefined,
  };

  await generationQueue.add('generate', jobData, { jobId: generation.id });

  // Increment use_count
  await db.execute(sql`
    UPDATE templates SET use_count = use_count + 1 WHERE id = ${templateId}
  `);

  return c.json(
    {
      success: true,
      data: { appId: app.id, generationId: generation.id },
      error: null,
    },
    202,
  );
});

export default templateRoutes;
