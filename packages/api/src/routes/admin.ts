import { Hono } from 'hono';
import { eq, desc, sql, and, ilike, or } from 'drizzle-orm';
import { db } from '../db/client.js';
import {
  users,
  tools,
  executions,
  reviews,
  creditTransactions,
  creditPurchases,
} from '../db/schema/index.js';
import { authMiddleware, type AuthUser } from '../middleware/auth.js';
import { grantCredits } from '../services/credit.service.js';

const adminRoutes = new Hono();

// Admin middleware: all routes require role='admin'
adminRoutes.use('*', authMiddleware);
adminRoutes.use('*', async (c, next) => {
  const user = c.get('user') as AuthUser;
  if (user.role !== 'admin') {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      403,
    );
  }
  await next();
});

// GET /admin/dashboard — Platform stats
adminRoutes.get('/dashboard', async (c) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsersResult,
    totalToolsResult,
    executionsTodayResult,
    executions30dResult,
    revenue30dResult,
    pendingReviewsResult,
    newUsers7dResult,
    recentSignups,
    recentTools,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(tools),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(executions)
      .where(sql`${executions.createdAt} >= ${todayStart}`),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(executions)
      .where(sql`${executions.createdAt} >= ${thirtyDaysAgo}`),
    db
      .select({ total: sql<string>`coalesce(sum(${creditPurchases.amountUsd}), 0)` })
      .from(creditPurchases)
      .where(
        and(
          eq(creditPurchases.status, 'completed'),
          sql`${creditPurchases.createdAt} >= ${thirtyDaysAgo}`,
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(tools)
      .where(eq(tools.status, 'pending_review')),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${users.createdAt} >= ${sevenDaysAgo}`),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5),
    db
      .select({
        id: tools.id,
        name: tools.name,
        slug: tools.slug,
        status: tools.status,
        createdAt: tools.createdAt,
      })
      .from(tools)
      .orderBy(desc(tools.createdAt))
      .limit(5),
  ]);

  return c.json({
    success: true,
    data: {
      stats: {
        totalUsers: totalUsersResult[0]?.count ?? 0,
        totalTools: totalToolsResult[0]?.count ?? 0,
        executionsToday: executionsTodayResult[0]?.count ?? 0,
        executions30d: executions30dResult[0]?.count ?? 0,
        revenue30d: parseFloat(revenue30dResult[0]?.total ?? '0'),
        pendingReviews: pendingReviewsResult[0]?.count ?? 0,
        newUsers7d: newUsers7dResult[0]?.count ?? 0,
      },
      recentSignups,
      recentTools,
    },
    error: null,
  });
});

// GET /admin/users — List users (paginated, searchable)
adminRoutes.get('/users', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;
  const search = c.req.query('q');

  const conditions: any[] = [];
  if (search) {
    conditions.push(
      or(
        ilike(users.email, `%${search}%`),
        ilike(users.name, `%${search}%`),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        creditBalance: users.creditBalance,
        createdAt: users.createdAt,
        totalExecutions: sql<number>`(
          select count(*)::int from executions where executions.user_id = ${users.id}
        )`,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
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

// PATCH /admin/users/:id — Update user
adminRoutes.patch('/users/:id', async (c) => {
  const id = c.req.param('id')!;
  const body = await c.req.json();
  const { role, banned, creditAdjustment, reason } = body;

  // Verify user exists
  const [existing] = await db
    .select({ id: users.id, creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!existing) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'User not found' } },
      404,
    );
  }

  const updates: Record<string, any> = { updatedAt: new Date() };

  if (role !== undefined) {
    const validRoles = ['buyer', 'creator', 'affiliate', 'admin'];
    if (!validRoles.includes(role)) {
      return c.json(
        { success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid role' } },
        400,
      );
    }
    updates.role = role;
  }

  // Update user
  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      creditBalance: users.creditBalance,
    });

  // Handle credit adjustment
  if (creditAdjustment && typeof creditAdjustment === 'number' && creditAdjustment !== 0) {
    const type = creditAdjustment > 0 ? 'admin_grant' : 'admin_deduct';
    const description = reason || `Admin credit adjustment: ${creditAdjustment > 0 ? '+' : ''}${creditAdjustment}`;

    if (creditAdjustment > 0) {
      await grantCredits(id, creditAdjustment, 'admin_grant', description);
    } else {
      // Deduct credits
      const absAmount = Math.abs(creditAdjustment);
      const result = await db
        .update(users)
        .set({
          creditBalance: sql`greatest(${users.creditBalance} - ${absAmount}, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({ creditBalance: users.creditBalance });

      if (result.length > 0) {
        await db.insert(creditTransactions).values({
          userId: id,
          type: 'admin_deduct',
          amount: -absAmount,
          balanceAfter: result[0].creditBalance,
          description,
        });
      }
    }
  }

  return c.json({ success: true, data: updated, error: null });
});

// GET /admin/tools — List all tools (paginated)
adminRoutes.get('/tools', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;
  const status = c.req.query('status');

  const conditions: any[] = [];
  if (status) {
    conditions.push(eq(tools.status, status as any));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: tools.id,
        name: tools.name,
        slug: tools.slug,
        status: tools.status,
        isFeatured: tools.isFeatured,
        totalRuns: tools.totalRuns,
        avgRating: tools.avgRating,
        createdAt: tools.createdAt,
        creatorId: tools.creatorId,
        creatorName: sql<string>`(
          select name from users where users.id = ${tools.creatorId}
        )`,
      })
      .from(tools)
      .where(where)
      .orderBy(desc(tools.createdAt))
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

// PATCH /admin/tools/:id — Admin tool actions
adminRoutes.patch('/tools/:id', async (c) => {
  const id = c.req.param('id')!;
  const body = await c.req.json();
  const { action } = body;

  const [existing] = await db
    .select({ id: tools.id, status: tools.status })
    .from(tools)
    .where(eq(tools.id, id))
    .limit(1);

  if (!existing) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tool not found' } },
      404,
    );
  }

  const updates: Record<string, any> = { updatedAt: new Date() };

  switch (action) {
    case 'publish':
      updates.status = 'published';
      break;
    case 'suspend':
      updates.status = 'suspended';
      break;
    case 'archive':
      updates.status = 'archived';
      break;
    case 'feature':
      updates.isFeatured = true;
      break;
    case 'unfeature':
      updates.isFeatured = false;
      break;
    default:
      return c.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid action. Use: publish, suspend, archive, feature, unfeature' },
        },
        400,
      );
  }

  const [updated] = await db
    .update(tools)
    .set(updates)
    .where(eq(tools.id, id))
    .returning({
      id: tools.id,
      name: tools.name,
      status: tools.status,
      isFeatured: tools.isFeatured,
    });

  return c.json({ success: true, data: updated, error: null });
});

// GET /admin/reports — List tool reports (paginated by status)
// Note: reports table does not exist in schema yet; this uses a simple
// query pattern so it can be wired up once the table is created.
// For now we return reviews flagged for moderation (placeholder).
adminRoutes.get('/reports', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const status = c.req.query('status') || 'open';

  // Placeholder: return empty until tool_reports table is created
  return c.json({
    success: true,
    data: {
      items: [],
      total: 0,
      page,
      pageSize: perPage,
      totalPages: 0,
    },
    error: null,
  });
});

// PATCH /admin/reports/:id — Resolve report
adminRoutes.patch('/reports/:id', async (c) => {
  const id = c.req.param('id')!;
  const body = await c.req.json();
  const { action } = body; // 'dismiss' | 'suspend_tool'

  // Placeholder: return not found until tool_reports table is created
  return c.json(
    {
      success: false,
      data: null,
      error: { code: 'NOT_FOUND', message: 'Report not found' },
    },
    404,
  );
});

export default adminRoutes;
