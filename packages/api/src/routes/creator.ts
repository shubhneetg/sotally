import { Hono } from 'hono';
import { eq, desc, and, sql, inArray, ilike } from 'drizzle-orm';
import { db } from '../db/client';
import {
  tools,
  users,
  categories,
  executions,
  creatorProfiles,
  creatorTransactions,
  toolTemplates,
} from '../db/schema/index';
import { authMiddleware, optionalAuthMiddleware, type AuthUser } from '../middleware/auth';
import { createToolSchema } from '@sotally/shared';
import { chatCompletion } from '../lib/openai';

const creatorRoutes = new Hono();

// ─── GET /creator/profile/:userId — Public creator profile (no auth) ────────

creatorRoutes.get('/profile/:userId', async (c) => {
  const userId = c.req.param('userId')!;

  // Get user + creator profile
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Creator not found' } },
      404,
    );
  }

  const [profile] = await db
    .select({
      bio: creatorProfiles.bio,
      specialization: creatorProfiles.specialization,
      website: creatorProfiles.website,
      socialLinks: creatorProfiles.socialLinks,
      level: creatorProfiles.level,
      verified: creatorProfiles.verified,
      createdAt: creatorProfiles.createdAt,
    })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Creator profile not found' } },
      404,
    );
  }

  // Get published tools
  const publishedTools = await db
    .select({
      id: tools.id,
      slug: tools.slug,
      name: tools.name,
      description: tools.description,
      iconUrl: tools.iconUrl,
      pricing: tools.pricing,
      totalRuns: tools.totalRuns,
      avgRating: tools.avgRating,
      createdAt: tools.createdAt,
    })
    .from(tools)
    .where(and(eq(tools.creatorId, userId), eq(tools.status, 'published')))
    .orderBy(desc(tools.totalRuns));

  // Calculate aggregate stats
  const totalTools = publishedTools.length;
  const totalRuns = publishedTools.reduce((sum, t) => sum + (t.totalRuns ?? 0), 0);
  const ratedTools = publishedTools.filter((t) => t.avgRating && parseFloat(t.avgRating) > 0);
  const avgRating =
    ratedTools.length > 0
      ? (ratedTools.reduce((sum, t) => sum + parseFloat(t.avgRating!), 0) / ratedTools.length).toFixed(1)
      : null;

  return c.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: profile.bio,
      specialization: profile.specialization,
      website: profile.website,
      socialLinks: profile.socialLinks,
      level: profile.level,
      verified: profile.verified,
      memberSince: profile.createdAt,
      stats: {
        totalTools,
        totalRuns,
        avgRating,
      },
      tools: publishedTools,
    },
    error: null,
  });
});

// ─── GET /creator/storefront/:username — Public creator storefront (no auth) ─

creatorRoutes.get('/storefront/:username', async (c) => {
  const username = c.req.param('username')!;

  // Try lookup by name (case-insensitive) or by user ID
  let [user] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(ilike(users.name, username))
    .limit(1);

  if (!user) {
    // Fallback: try as UUID
    [user] = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, username))
      .limit(1);
  }

  if (!user) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Creator not found' } },
      404,
    );
  }

  const [profile] = await db
    .select({
      bio: creatorProfiles.bio,
      specialization: creatorProfiles.specialization,
      website: creatorProfiles.website,
      socialLinks: creatorProfiles.socialLinks,
      level: creatorProfiles.level,
      verified: creatorProfiles.verified,
      createdAt: creatorProfiles.createdAt,
    })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, user.id))
    .limit(1);

  if (!profile) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Creator profile not found' } },
      404,
    );
  }

  // Get published tools
  const publishedTools = await db
    .select({
      id: tools.id,
      slug: tools.slug,
      name: tools.name,
      description: tools.description,
      iconUrl: tools.iconUrl,
      pricing: tools.pricing,
      totalRuns: tools.totalRuns,
      avgRating: tools.avgRating,
      createdAt: tools.createdAt,
    })
    .from(tools)
    .where(and(eq(tools.creatorId, user.id), eq(tools.status, 'published')))
    .orderBy(desc(tools.totalRuns));

  // Calculate aggregate stats
  const totalTools = publishedTools.length;
  const totalRuns = publishedTools.reduce((sum, t) => sum + (t.totalRuns ?? 0), 0);
  const ratedTools = publishedTools.filter((t) => t.avgRating && parseFloat(t.avgRating) > 0);
  const avgRating =
    ratedTools.length > 0
      ? (ratedTools.reduce((sum, t) => sum + parseFloat(t.avgRating!), 0) / ratedTools.length).toFixed(1)
      : null;

  return c.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: profile.bio,
      specialization: profile.specialization,
      website: profile.website,
      socialLinks: profile.socialLinks,
      level: profile.level,
      verified: profile.verified,
      memberSince: profile.createdAt,
      stats: {
        totalTools,
        totalRuns,
        avgRating,
      },
      tools: publishedTools,
    },
    error: null,
  });
});

// All remaining creator routes require auth
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

  // ─── Pre-publish validation ──────────────────────────────────────────────
  const [fullTool] = await db
    .select()
    .from(tools)
    .where(eq(tools.id, toolId))
    .limit(1);

  const errors: string[] = [];

  if (!fullTool.name?.trim()) errors.push('Tool name is required');
  if (!fullTool.description?.trim()) errors.push('Tool description is required');

  // Validate inputSchema: must be parseable JSON with at least one property
  const inputSchema = fullTool.inputSchema as Record<string, any> | null;
  if (!inputSchema || typeof inputSchema !== 'object') {
    errors.push('Tool must have a valid input schema');
  } else {
    const props = inputSchema.properties ?? inputSchema;
    if (!props || typeof props !== 'object' || Object.keys(props).length === 0) {
      errors.push('Input schema must have at least one property');
    }
  }

  // Validate config has at least one step
  const config = fullTool.config as Record<string, any> | null;
  if (!config || typeof config !== 'object' || Object.keys(config).length === 0) {
    errors.push('Tool must have execution config');
  } else if (Array.isArray(config.steps) && config.steps.length === 0) {
    errors.push('Tool config must have at least one step');
  }

  // Blocked words check
  const blockedWords = ['hack', 'crack', 'exploit', 'malware', 'phishing', 'ddos'];
  const nameAndDesc = `${fullTool.name} ${fullTool.description}`.toLowerCase();
  if (blockedWords.some((w) => nameAndDesc.includes(w))) {
    errors.push('Tool name or description contains prohibited content');
  }

  if (errors.length > 0) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'VALIDATION_FAILED', message: errors.join('; ') },
      },
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

// ─── GET /creator/templates — List all tool templates ─────────────────────────

creatorRoutes.get('/templates', async (c) => {
  const templates = await db
    .select({
      id: toolTemplates.id,
      name: toolTemplates.name,
      description: toolTemplates.description,
      executionType: toolTemplates.executionType,
      defaultConfig: toolTemplates.defaultConfig,
      inputSchema: toolTemplates.inputSchema,
      outputSchema: toolTemplates.outputSchema,
      createdAt: toolTemplates.createdAt,
    })
    .from(toolTemplates)
    .orderBy(toolTemplates.name);

  return c.json({ success: true, data: templates, error: null });
});

// ─── POST /creator/canvas/generate — AI-assisted tool generation ─────────────

creatorRoutes.post('/canvas/generate', async (c) => {
  const user = c.get('user') as AuthUser;
  await ensureCreator(user);

  const body = await c.req.json();
  const description = body.description;

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Please provide a description of at least 10 characters' },
      },
      400,
    );
  }

  const metaPrompt = `You are a tool builder assistant. Given a description of what a tool should do, generate a complete tool configuration in JSON format.

User's description: ${description.trim()}

Generate JSON with:
- name: Tool name (concise, descriptive)
- slug: URL-friendly version of name (lowercase, hyphens, no spaces)
- description: One-line description (max 200 chars)
- inputSchema: JSON Schema for user inputs (include helpful titles and descriptions, use "type": "object" with "properties" and "required")
- config: { steps: [{ type: "llm", id: "main", model: "deepseek-chat", systemPrompt: "...", prompt: "...", temperature: 0.7, maxTokens: 1000 }, { type: "output", id: "result", template: "{{steps.main}}", format: "markdown" }] }
- suggestedCategory: one of (ai-writing, marketing, data-tools, productivity, development, business)
- suggestedPrice: number of credits (2-20)

Return ONLY valid JSON, no explanation.`;

  try {
    const result = await chatCompletion(
      'deepseek-chat',
      [
        { role: 'system', content: 'You generate tool configurations in JSON format. Return only valid JSON.' },
        { role: 'user', content: metaPrompt },
      ],
      { temperature: 0.7, maxTokens: 2000 },
    );

    // Parse the JSON response
    let parsed;
    try {
      // Handle potential markdown code blocks in response
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return c.json(
        {
          success: false,
          data: null,
          error: { code: 'GENERATION_ERROR', message: 'Failed to parse AI response. Please try again.' },
        },
        500,
      );
    }

    return c.json({
      success: true,
      data: {
        name: parsed.name || 'Untitled Tool',
        slug: parsed.slug || 'untitled-tool',
        description: parsed.description || '',
        inputSchema: parsed.inputSchema || {},
        config: parsed.config || {},
        suggestedCategory: parsed.suggestedCategory || 'productivity',
        suggestedPrice: parsed.suggestedPrice || 5,
      },
      error: null,
    });
  } catch (err) {
    return c.json(
      {
        success: false,
        data: null,
        error: {
          code: 'GENERATION_ERROR',
          message: err instanceof Error ? err.message : 'Failed to generate tool configuration',
        },
      },
      500,
    );
  }
});

export default creatorRoutes;
