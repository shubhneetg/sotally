import { Hono } from 'hono';
import { eq, desc, asc, sql, and, ilike } from 'drizzle-orm';
import { db } from '../db/client';
import { tools, users, categories, reviews, executions } from '../db/schema/index';
import { authMiddleware, type AuthUser } from '../middleware/auth';
import { holdCredits } from '../services/credit.service';
import { executionQueue } from '../lib/queue';

const toolRoutes = new Hono();

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

  // Category filter by slug
  if (category) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);

    if (cat) {
      conditions.push(eq(tools.categoryId, cat.id));
    }
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  // Sort
  let orderBy;
  switch (sort) {
    case 'newest':
      orderBy = desc(tools.createdAt);
      break;
    case 'rating':
      orderBy = desc(tools.avgRating);
      break;
    case 'popular':
    default:
      orderBy = desc(tools.totalRuns);
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
      })
      .from(tools)
      .where(where)
      .orderBy(orderBy)
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
toolRoutes.post('/:slug/execute', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
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

  // Validate input against tool's inputSchema if present
  const input = body.input ?? {};

  // Determine credits to charge
  const pricing = tool.pricing as any;
  let creditsToCharge = 0;

  switch (pricing.model) {
    case 'per_execution':
      creditsToCharge = pricing.creditsPerRun;
      break;
    case 'free':
      creditsToCharge = 0;
      break;
    case 'tiered':
      // Use first tier rate as default
      creditsToCharge = pricing.tiers?.[0]?.creditsPerRun ?? 0;
      break;
    case 'freemium':
      creditsToCharge = pricing.creditsPerRunAfterFree ?? 0;
      break;
    case 'bundle':
      creditsToCharge = Math.ceil(pricing.creditsPerBundle / pricing.bundleSize);
      break;
    default:
      creditsToCharge = 5; // fallback
  }

  // Create execution record
  const [execution] = await db
    .insert(executions)
    .values({
      toolId: tool.id,
      userId: user.id,
      status: 'queued',
      input,
      creditsCharged: creditsToCharge,
    })
    .returning();

  // Hold credits (atomic check + deduct)
  if (creditsToCharge > 0) {
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

export default toolRoutes;
