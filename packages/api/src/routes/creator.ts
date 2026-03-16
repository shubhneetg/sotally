import { Hono } from 'hono';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import {
  tools,
  users,
  categories,
  executions,
  creatorProfiles,
  creatorTransactions,
} from '../db/schema/index';
import { authMiddleware, type AuthUser } from '../middleware/auth';
import { createToolSchema } from '@sotally/shared';

const creatorRoutes = new Hono();

// All creator routes require auth
creatorRoutes.use('*', authMiddleware);

// ─── Helper: ensure user has creator role (auto-upgrade if needed) ──────────

async function ensureCreator(user: AuthUser) {
  if (user.role === 'creator' || user.role === 'admin') {
    return;
  }

  // Auto-upgrade user to creator role
  await db
    .update(users)
    .set({ role: 'creator', updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Create creator profile if it doesn't exist
  const [existing] = await db
    .select({ id: creatorProfiles.id })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, user.id))
    .limit(1);

  if (!existing) {
    await db.insert(creatorProfiles).values({ userId: user.id });
  }
}

// ─── POST /creator/tools — Create new tool ──────────────────────────────────

creatorRoutes.post('/tools', async (c) => {
  const user = c.get('user') as AuthUser;
  await ensureCreator(user);

  const body = await c.req.json();
  const parsed = createToolSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid tool data',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      400,
    );
  }

  // Check slug uniqueness
  const [existingSlug] = await db
    .select({ id: tools.id })
    .from(tools)
    .where(eq(tools.slug, parsed.data.slug))
    .limit(1);

  if (existingSlug) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'CONFLICT', message: 'A tool with this slug already exists' },
      },
      409,
    );
  }

  const [tool] = await db
    .insert(tools)
    .values({
      creatorId: user.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      longDescription: parsed.data.longDescription,
      categoryId: parsed.data.categoryId,
      executionType: parsed.data.executionType,
      pricing: parsed.data.pricing,
      inputSchema: parsed.data.inputSchema,
      outputSchema: parsed.data.outputSchema,
      config: parsed.data.config,
      iconUrl: parsed.data.iconUrl ?? null,
      tags: parsed.data.tags ?? [],
      status: 'draft',
    })
    .returning();

  return c.json({ success: true, data: tool, error: null }, 201);
});

// ─── PUT /creator/tools/:id — Update tool ───────────────────────────────────

creatorRoutes.put('/tools/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const toolId = c.req.param('id')!;

  // Verify ownership
  const [tool] = await db
    .select({ id: tools.id, creatorId: tools.creatorId })
    .from(tools)
    .where(eq(tools.id, toolId))
    .limit(1);

  if (!tool) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tool not found' } },
      404,
    );
  }

  if (tool.creatorId !== user.id && user.role !== 'admin') {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'You do not own this tool' } },
      403,
    );
  }

  const body = await c.req.json();

  // Partial update — pick allowed fields
  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    'name', 'slug', 'description', 'longDescription', 'categoryId',
    'executionType', 'pricing', 'inputSchema', 'outputSchema', 'config',
    'iconUrl', 'tags', 'demoOutput', 'seoTitle', 'seoDescription',
  ] as const;

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(tools)
    .set(updateData)
    .where(eq(tools.id, toolId))
    .returning();

  return c.json({ success: true, data: updated, error: null });
});

// ─── POST /creator/tools/:id/publish — Publish tool ─────────────────────────

creatorRoutes.post('/tools/:id/publish', async (c) => {
  const user = c.get('user') as AuthUser;
  const toolId = c.req.param('id')!;

  const [tool] = await db
    .select({ id: tools.id, creatorId: tools.creatorId, status: tools.status })
    .from(tools)
    .where(eq(tools.id, toolId))
    .limit(1);

  if (!tool) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tool not found' } },
      404,
    );
  }

  if (tool.creatorId !== user.id && user.role !== 'admin') {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'You do not own this tool' } },
      403,
    );
  }

  if (tool.status === 'published') {
    return c.json(
      { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'Tool is already published' } },
      400,
    );
  }

  const [updated] = await db
    .update(tools)
    .set({ status: 'published', updatedAt: new Date() })
    .where(eq(tools.id, toolId))
    .returning();

  return c.json({ success: true, data: updated, error: null });
});

// ─── GET /creator/tools — List own tools ─────────────────────────────────────

creatorRoutes.get('/tools', async (c) => {
  const user = c.get('user') as AuthUser;
  const status = c.req.query('status');
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;

  const conditions: any[] = [eq(tools.creatorId, user.id)];

  if (status && ['draft', 'published', 'archived', 'pending_review', 'suspended'].includes(status)) {
    conditions.push(eq(tools.status, status as any));
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: tools.id,
        slug: tools.slug,
        name: tools.name,
        description: tools.description,
        iconUrl: tools.iconUrl,
        pricing: tools.pricing,
        totalRuns: tools.totalRuns,
        avgRating: tools.avgRating,
        status: tools.status,
        categoryId: tools.categoryId,
        createdAt: tools.createdAt,
        updatedAt: tools.updatedAt,
      })
      .from(tools)
      .where(where)
      .orderBy(desc(tools.updatedAt))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(tools)
      .where(where),
  ]);

  // Calculate per-tool earnings from executions
  const toolIds = items.map((t) => t.id);
  let earningsMap = new Map<string, number>();

  if (toolIds.length > 0) {
    const earningsResult = await db
      .select({
        toolId: executions.toolId,
        totalEarnings: sql<number>`coalesce(sum(${executions.creditsCharged} - ${executions.creditsRefunded}), 0)::int`,
      })
      .from(executions)
      .where(inArray(executions.toolId, toolIds))
      .groupBy(executions.toolId);

    earningsMap = new Map(earningsResult.map((e) => [e.toolId, e.totalEarnings]));
  }

  const enriched = items.map((t) => ({
    ...t,
    earnings: earningsMap.get(t.id) ?? 0,
  }));

  const total = countResult[0]?.count ?? 0;

  return c.json({
    success: true,
    data: {
      items: enriched,
      total,
      page,
      pageSize: perPage,
      totalPages: Math.ceil(total / perPage),
    },
    error: null,
  });
});

// ─── GET /creator/analytics — Dashboard analytics ───────────────────────────

creatorRoutes.get('/analytics', async (c) => {
  const user = c.get('user') as AuthUser;
  const days = Math.min(90, Math.max(1, parseInt(c.req.query('days') || '30', 10)));
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get all creator tool IDs
  const creatorTools = await db
    .select({ id: tools.id })
    .from(tools)
    .where(eq(tools.creatorId, user.id));

  const toolIds = creatorTools.map((t) => t.id);

  if (toolIds.length === 0) {
    return c.json({
      success: true,
      data: {
        totalRuns: 0,
        totalEarnings: 0,
        topTools: [],
        dailyStats: [],
      },
      error: null,
    });
  }

  // Total runs and earnings in period
  const [aggregates] = await db
    .select({
      totalRuns: sql<number>`count(*)::int`,
      totalEarnings: sql<number>`coalesce(sum(${executions.creditsCharged} - ${executions.creditsRefunded}), 0)::int`,
    })
    .from(executions)
    .where(
      and(
        inArray(executions.toolId, toolIds),
        sql`${executions.createdAt} >= ${since}`,
      ),
    );

  // Top tools by runs
  const topTools = await db
    .select({
      toolId: executions.toolId,
      runs: sql<number>`count(*)::int`,
      earnings: sql<number>`coalesce(sum(${executions.creditsCharged} - ${executions.creditsRefunded}), 0)::int`,
    })
    .from(executions)
    .where(
      and(
        inArray(executions.toolId, toolIds),
        sql`${executions.createdAt} >= ${since}`,
      ),
    )
    .groupBy(executions.toolId)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  // Enrich with tool names
  const topToolIds = topTools.map((t) => t.toolId);
  let toolNameMap = new Map<string, string>();
  if (topToolIds.length > 0) {
    const toolNames = await db
      .select({ id: tools.id, name: tools.name })
      .from(tools)
      .where(inArray(tools.id, topToolIds));
    toolNameMap = new Map(toolNames.map((t) => [t.id, t.name]));
  }

  // Daily stats for chart
  const dailyStats = await db
    .select({
      date: sql<string>`to_char(${executions.createdAt}::date, 'YYYY-MM-DD')`,
      runs: sql<number>`count(*)::int`,
      earnings: sql<number>`coalesce(sum(${executions.creditsCharged} - ${executions.creditsRefunded}), 0)::int`,
    })
    .from(executions)
    .where(
      and(
        inArray(executions.toolId, toolIds),
        sql`${executions.createdAt} >= ${since}`,
      ),
    )
    .groupBy(sql`${executions.createdAt}::date`)
    .orderBy(sql`${executions.createdAt}::date`);

  return c.json({
    success: true,
    data: {
      totalRuns: aggregates?.totalRuns ?? 0,
      totalEarnings: aggregates?.totalEarnings ?? 0,
      topTools: topTools.map((t) => ({
        toolId: t.toolId,
        name: toolNameMap.get(t.toolId) ?? 'Unknown',
        runs: t.runs,
        earnings: t.earnings,
      })),
      dailyStats,
    },
    error: null,
  });
});

// ─── GET /creator/earnings — Earnings history ───────────────────────────────

creatorRoutes.get('/earnings', async (c) => {
  const user = c.get('user') as AuthUser;
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;

  // Find creator profile
  const [profile] = await db
    .select({ id: creatorProfiles.id, totalEarnings: creatorProfiles.totalEarnings })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, user.id))
    .limit(1);

  if (!profile) {
    return c.json({
      success: true,
      data: {
        balance: 0,
        items: [],
        total: 0,
        page,
        pageSize: perPage,
        totalPages: 0,
      },
      error: null,
    });
  }

  const where = eq(creatorTransactions.creatorId, profile.id);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: creatorTransactions.id,
        type: creatorTransactions.type,
        amount: creatorTransactions.amount,
        balanceAfter: creatorTransactions.balanceAfter,
        description: creatorTransactions.description,
        referenceId: creatorTransactions.referenceId,
        referenceType: creatorTransactions.referenceType,
        createdAt: creatorTransactions.createdAt,
      })
      .from(creatorTransactions)
      .where(where)
      .orderBy(desc(creatorTransactions.createdAt))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(creatorTransactions)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return c.json({
    success: true,
    data: {
      balance: profile.totalEarnings,
      items,
      total,
      page,
      pageSize: perPage,
      totalPages: Math.ceil(total / perPage),
    },
    error: null,
  });
});

// ─── DELETE /creator/tools/:id — Soft delete (archive) ──────────────────────

creatorRoutes.delete('/tools/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const toolId = c.req.param('id')!;

  const [tool] = await db
    .select({ id: tools.id, creatorId: tools.creatorId })
    .from(tools)
    .where(eq(tools.id, toolId))
    .limit(1);

  if (!tool) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tool not found' } },
      404,
    );
  }

  if (tool.creatorId !== user.id && user.role !== 'admin') {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'You do not own this tool' } },
      403,
    );
  }

  const [updated] = await db
    .update(tools)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(tools.id, toolId))
    .returning();

  return c.json({ success: true, data: updated, error: null });
});

export default creatorRoutes;
