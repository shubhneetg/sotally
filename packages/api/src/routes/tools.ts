import { Hono } from 'hono';
import { eq, desc, asc, sql, and, ilike } from 'drizzle-orm';
import { db } from '../db/client';
import { tools, users, categories, reviews, executions, toolReports } from '../db/schema/index';
import { authMiddleware, optionalAuthMiddleware, type AuthUser } from '../middleware/auth';
import { holdCredits } from '../services/credit.service';
import { executionQueue } from '../lib/queue';
import { redis } from '../lib/redis';
import { rateLimit } from '../middleware/rate-limit';

const toolRoutes = new Hono();

// GET /tools/categories — list all categories
toolRoutes.get('/categories', async (c) => {
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .orderBy(asc(categories.name));

  return c.json({
    success: true,
    data: allCategories,
    error: null,
  });
});

// GET /tools/trending — trending tools (most executions in last 7 days)
toolRoutes.get('/trending', async (c) => {
  const trendingTools = await db
    .select({
      id: tools.id,
      slug: tools.slug,
      name: tools.name,
      description: tools.description,
      iconUrl: tools.iconUrl,
      pricing: tools.pricing,
      totalRuns: tools.totalRuns,
      avgRating: tools.avgRating,
      isFeatured: tools.isFeatured,
      categoryId: tools.categoryId,
      creatorId: tools.creatorId,
      createdAt: tools.createdAt,
      recentRuns: sql<number>`count(${executions.id})::int`,
    })
    .from(tools)
    .innerJoin(executions, eq(executions.toolId, tools.id))
    .where(
      and(
        eq(tools.status, 'published'),
        sql`${executions.createdAt} > NOW() - INTERVAL '7 days'`,
      ),
    )
    .groupBy(tools.id)
    .orderBy(sql`count(${executions.id}) DESC`)
    .limit(10);

  return c.json({
    success: true,
    data: trendingTools,
    error: null,
  });
});

// GET /tools — list published tools
toolRoutes.get('/', async (c) => {
  const q = c.req.query('q');
  const category = c.req.query('category');
  const sort = c.req.query('sort') || 'popular';
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;

  const conditions: any[] = [eq(tools.status, 'published')];

  // Full-text search on name + description
  if (q) {
    conditions.push(
      sql`(
        to_tsvector('english', ${tools.name} || ' ' || ${tools.description})
        @@ plainto_tsquery('english', ${q})
      )`,
    );
  }

  // Category filter by slug (also accepts name as fallback)
  if (category) {
    let [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);

    if (!cat) {
      [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(ilike(categories.name, category))
        .limit(1);
    }

    if (cat) {
      conditions.push(eq(tools.categoryId, cat.id));
    }
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  // Sort — always include secondary sort by createdAt for deterministic ordering
  let primaryOrder;
  switch (sort) {
    case 'newest':
      primaryOrder = desc(tools.createdAt);
      break;
    case 'rating':
      primaryOrder = desc(tools.avgRating);
      break;
    case 'popular':
    default:
      primaryOrder = desc(tools.totalRuns);
      break;
  }

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
        isFeatured: tools.isFeatured,
        categoryId: tools.categoryId,
        creatorId: tools.creatorId,
        createdAt: tools.createdAt,
        creatorName: users.name,
      })
      .from(tools)
      .leftJoin(users, eq(tools.creatorId, users.id))
      .where(where)
      .orderBy(primaryOrder, desc(tools.createdAt))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(tools)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return c.json({
    success: true,
    data: {
      items,
      total,
      page,
      pageSize: perPage,
      totalPages: Math.ceil(total / perPage),
    },
    error: null,
  });
});

// GET /tools/:slug — get tool detail
toolRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')!;

  const [tool] = await db
    .select({
      id: tools.id,
      slug: tools.slug,
      name: tools.name,
      description: tools.description,
      longDescription: tools.longDescription,
      iconUrl: tools.iconUrl,
      pricing: tools.pricing,
      inputSchema: tools.inputSchema,
      outputSchema: tools.outputSchema,
      totalRuns: tools.totalRuns,
      avgRating: tools.avgRating,
      isFeatured: tools.isFeatured,
      categoryId: tools.categoryId,
      creatorId: tools.creatorId,
      tags: tools.tags,
      demoOutput: tools.demoOutput,
      status: tools.status,
      createdAt: tools.createdAt,
      updatedAt: tools.updatedAt,
    })
    .from(tools)
    .where(eq(tools.slug, slug))
    .limit(1);

  if (!tool || tool.status !== 'published') {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tool not found' } },
      404,
    );
  }

  // Fetch creator info
  const [creator] = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, tool.creatorId))
    .limit(1);

  // Fetch category
  let categoryData = null;
  if (tool.categoryId) {
    const [cat] = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.id, tool.categoryId))
      .limit(1);
    categoryData = cat || null;
  }

  return c.json({
    success: true,
    data: {
      ...tool,
      creator: creator || null,
      category: categoryData,
    },
    error: null,
  });
});

// POST /tools/:slug/execute — execute a tool
toolRoutes.post('/:slug/execute', rateLimit({ windowMs: 60_000, maxRequests: 30, keyPrefix: 'rl:execute' }), optionalAuthMiddleware, async (c) => {
  const user = c.get('user') as AuthUser | undefined;
  const slug = c.req.param('slug')!;
  const body = await c.req.json();

  // Fetch the tool
  const [tool] = await db
    .select()
    .from(tools)
    .where(and(eq(tools.slug, slug), eq(tools.status, 'published')))
    .limit(1);

  if (!tool) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tool not found' } },
      404,
    );
  }

  // Determine credits to charge
  const pricing = tool.pricing as any;
  let creditsToCharge = 0;

  switch (pricing.model) {
    case 'per_run':
    case 'per_execution':
      creditsToCharge = pricing.creditsPerRun;
      break;
    case 'free':
      creditsToCharge = 0;
      break;
    case 'tiered':
      // Use selected tier or first tier as default
      const selectedTier = body.tierId
        ? pricing.tiers?.find((t: any) => t.id === body.tierId)
        : pricing.tiers?.[0];
      creditsToCharge = selectedTier?.credits ?? 0;
      break;
    case 'freemium':
      creditsToCharge = pricing.creditsPerRunAfterFree ?? 0;
      break;
    case 'bundle':
      creditsToCharge = Math.ceil(pricing.creditsPerBundle / pricing.bundleSize);
      break;
    default:
      creditsToCharge = pricing.creditsPerRun ?? 5; // fallback
  }

  // Paid tools require authentication
  if (pricing.model !== 'free' && !user) {
    return c.json(
      { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required for paid tools' } },
      401,
    );
  }

  // Guest rate limiting for free tools (3 executions per IP per day)
  if (!user) {
    const forwarded = c.req.header('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `guest_exec:${ip}:${new Date().toISOString().slice(0, 10)}`;
    const currentCount = await redis.incr(rateLimitKey);

    // Set expiry on first increment (24 hours)
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, 86400);
    }

    if (currentCount > 3) {
      return c.json(
        {
          success: false,
          data: null,
          error: { code: 'RATE_LIMITED', message: 'Guest execution limit reached (3/day). Please sign in for unlimited access.' },
        },
        429,
      );
    }
  }

  // Validate input against tool's inputSchema if present
  const input = body.input ?? {};
  const useOwnKey = body.useOwnKey ?? false;

  // Create execution record (userId is null for guests)
  const [execution] = await db
    .insert(executions)
    .values({
      toolId: tool.id,
      userId: user?.id ?? null,
      status: 'queued',
      input,
      creditsCharged: creditsToCharge,
    })
    .returning();

  // Hold credits (atomic check + deduct) — only for authenticated users with charges
  if (creditsToCharge > 0 && user) {
    const hold = await holdCredits(user.id, creditsToCharge, execution.id, 'execution');

    if (!hold.success) {
      // Roll back the execution record
      await db
        .update(executions)
        .set({ status: 'failed', error: 'Insufficient credits' })
        .where(eq(executions.id, execution.id));

      return c.json(
        {
          success: false,
          data: null,
          error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits to execute this tool' },
        },
        402,
      );
    }
  }

  // Queue the execution job
  await executionQueue.add(
    'execute',
    {
      executionId: execution.id,
      toolId: tool.id,
      creatorId: tool.creatorId,
      input,
      config: tool.config,
      executionType: tool.executionType,
      creditsCharged: creditsToCharge,
      useOwnKey,
    },
    {
      jobId: execution.id,
    },
  );

  return c.json(
    {
      success: true,
      data: { executionId: execution.id, status: 'queued' },
      error: null,
    },
    202,
  );
});

// GET /tools/:slug/reviews — paginated reviews
toolRoutes.get('/:slug/reviews', async (c) => {
  const slug = c.req.param('slug')!;
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;

  // Resolve tool ID from slug
  const [tool] = await db
    .select({ id: tools.id })
    .from(tools)
    .where(eq(tools.slug, slug))
    .limit(1);

  if (!tool) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tool not found' } },
      404,
    );
  }

  const where = eq(reviews.toolId, tool.id);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userId: reviews.userId,
      })
      .from(reviews)
      .where(where)
      .orderBy(desc(reviews.createdAt))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(where),
  ]);

  // Fetch reviewer names
  const userIds = [...new Set(items.map((r) => r.userId))];
  const reviewUsers =
    userIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
          .from(users)
          .where(sql`${users.id} = ANY(${userIds})`)
      : [];

  const userMap = new Map(reviewUsers.map((u) => [u.id, u]));
  const enriched = items.map((r) => ({
    ...r,
    user: userMap.get(r.userId) || null,
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

// GET /tools/:slug/similar — tools that users also ran
toolRoutes.get('/:slug/similar', async (c) => {
  const slug = c.req.param('slug')!;

  // Resolve tool ID from slug
  const [tool] = await db
    .select({ id: tools.id })
    .from(tools)
    .where(eq(tools.slug, slug))
    .limit(1);

  if (!tool) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tool not found' } },
      404,
    );
  }

  // Find other tools run by users who also ran this tool, ranked by frequency
  const similarTools = await db
    .select({
      id: tools.id,
      slug: tools.slug,
      name: tools.name,
      description: tools.description,
      iconUrl: tools.iconUrl,
      pricing: tools.pricing,
      totalRuns: tools.totalRuns,
      avgRating: tools.avgRating,
      isFeatured: tools.isFeatured,
      categoryId: tools.categoryId,
      creatorId: tools.creatorId,
      createdAt: tools.createdAt,
      overlapCount: sql<number>`count(*)::int`,
    })
    .from(tools)
    .innerJoin(executions, eq(executions.toolId, tools.id))
    .where(
      and(
        sql`${executions.userId} IN (
          SELECT DISTINCT ${executions.userId} FROM ${executions} WHERE ${executions.toolId} = ${tool.id} AND ${executions.userId} IS NOT NULL
        )`,
        sql`${tools.id} != ${tool.id}`,
        eq(tools.status, 'published'),
      ),
    )
    .groupBy(tools.id)
    .orderBy(sql`count(*) DESC`)
    .limit(6);

  return c.json({
    success: true,
    data: similarTools,
    error: null,
  });
});

// POST /tools/:slug/report — report a tool
toolRoutes.post('/:slug/report', authMiddleware, async (c) => {
  const slug = c.req.param('slug')!;
  const user = c.get('user') as AuthUser;
  const { reason, description } = await c.req.json();

  // Validate reason
  const validReasons = ['spam', 'misleading', 'broken', 'inappropriate', 'copyright', 'malicious', 'other'];
  if (!reason || !validReasons.includes(reason)) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: `Invalid reason. Use: ${validReasons.join(', ')}` },
      },
      400,
    );
  }

  // Find tool by slug
  const [tool] = await db
    .select({ id: tools.id, creatorId: tools.creatorId })
    .from(tools)
    .where(eq(tools.slug, slug))
    .limit(1);

  if (!tool) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tool not found' } },
      404,
    );
  }

  // Can't report your own tool
  if (tool.creatorId === user.id) {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'Cannot report your own tool' } },
      403,
    );
  }

  // Insert report
  const [report] = await db
    .insert(toolReports)
    .values({
      toolId: tool.id,
      reporterId: user.id,
      reason: reason as any,
      description: description || null,
    })
    .returning();

  return c.json({ success: true, data: report, error: null });
});

export default toolRoutes;
