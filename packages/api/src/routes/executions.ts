import { Hono } from 'hono';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { executions, tools } from '../db/schema/index.js';
import { authMiddleware, type AuthUser } from '../middleware/auth.js';

const executionRoutes = new Hono();

// GET /executions/:id — get execution status + result (own only)
executionRoutes.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const id = c.req.param('id')!;

  const [execution] = await db
    .select({
      id: executions.id,
      toolId: executions.toolId,
      userId: executions.userId,
      status: executions.status,
      input: executions.input,
      output: executions.output,
      error: executions.error,
      creditsCharged: executions.creditsCharged,
      creditsRefunded: executions.creditsRefunded,
      durationMs: executions.durationMs,
      startedAt: executions.startedAt,
      completedAt: executions.completedAt,
      createdAt: executions.createdAt,
    })
    .from(executions)
    .where(and(eq(executions.id, id), eq(executions.userId, user.id)))
    .limit(1);

  if (!execution) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Execution not found' } },
      404,
    );
  }

  // Fetch tool info
  const [tool] = await db
    .select({ slug: tools.slug, name: tools.name, iconUrl: tools.iconUrl })
    .from(tools)
    .where(eq(tools.id, execution.toolId))
    .limit(1);

  return c.json({
    success: true,
    data: { ...execution, tool: tool || null },
    error: null,
  });
});

// GET /executions — list user's execution history, paginated
executionRoutes.get('/', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;

  const where = eq(executions.userId, user.id);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: executions.id,
        toolId: executions.toolId,
        status: executions.status,
        creditsCharged: executions.creditsCharged,
        durationMs: executions.durationMs,
        createdAt: executions.createdAt,
        completedAt: executions.completedAt,
      })
      .from(executions)
      .where(where)
      .orderBy(desc(executions.createdAt))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(executions)
      .where(where),
  ]);

  // Fetch tool names for each execution
  const toolIds = [...new Set(items.map((e) => e.toolId))];
  const toolsData =
    toolIds.length > 0
      ? await db
          .select({ id: tools.id, slug: tools.slug, name: tools.name, iconUrl: tools.iconUrl })
          .from(tools)
          .where(sql`${tools.id} = ANY(${toolIds})`)
      : [];

  const toolMap = new Map(toolsData.map((t) => [t.id, t]));
  const enriched = items.map((e) => ({
    ...e,
    tool: toolMap.get(e.toolId) || null,
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

export default executionRoutes;
