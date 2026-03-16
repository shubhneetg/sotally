import { Hono } from 'hono';
import { eq, and, sql, avg } from 'drizzle-orm';
import { db } from '../db/client.js';
import { reviews, tools, executions } from '../db/schema/index.js';
import { authMiddleware, type AuthUser } from '../middleware/auth.js';

const reviewRoutes = new Hono();

// Helper: recalculate and update tool.avgRating
async function recalculateAvgRating(toolId: string): Promise<void> {
  const [result] = await db
    .select({ avg: sql<string>`round(avg(${reviews.rating}), 2)` })
    .from(reviews)
    .where(eq(reviews.toolId, toolId));

  await db
    .update(tools)
    .set({
      avgRating: result?.avg ?? null,
      updatedAt: new Date(),
    })
    .where(eq(tools.id, toolId));
}

// POST /reviews — Create review (upsert)
reviewRoutes.post('/', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const body = await c.req.json();

  const { toolId, rating, comment } = body;

  // Validate input
  if (!toolId || !rating) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'toolId and rating are required' },
      },
      400,
    );
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'rating must be an integer between 1 and 5' },
      },
      400,
    );
  }

  // Check tool exists
  const [tool] = await db
    .select({ id: tools.id })
    .from(tools)
    .where(eq(tools.id, toolId))
    .limit(1);

  if (!tool) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Tool not found' } },
      404,
    );
  }

  // Validate user has executed the tool at least once
  const [execution] = await db
    .select({ id: executions.id })
    .from(executions)
    .where(
      and(
        eq(executions.toolId, toolId),
        eq(executions.userId, user.id),
        eq(executions.status, 'completed'),
      ),
    )
    .limit(1);

  if (!execution) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'You must execute the tool at least once before reviewing' },
      },
      403,
    );
  }

  // Upsert: check if review exists
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.toolId, toolId), eq(reviews.userId, user.id)))
    .limit(1);

  let review;
  if (existing) {
    // Update existing review
    [review] = await db
      .update(reviews)
      .set({ rating, comment: comment ?? null })
      .where(eq(reviews.id, existing.id))
      .returning();
  } else {
    // Insert new review
    [review] = await db
      .insert(reviews)
      .values({
        toolId,
        userId: user.id,
        rating,
        comment: comment ?? null,
      })
      .returning();
  }

  // Recalculate avgRating
  await recalculateAvgRating(toolId);

  return c.json(
    {
      success: true,
      data: review,
      error: null,
    },
    existing ? 200 : 201,
  );
});

// PUT /reviews/:id — Update own review
reviewRoutes.put('/:id', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const id = c.req.param('id')!;
  const body = await c.req.json();

  const { rating, comment } = body;

  // Fetch existing review
  const [existing] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1);

  if (!existing) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Review not found' } },
      404,
    );
  }

  if (existing.userId !== user.id) {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'You can only update your own reviews' } },
      403,
    );
  }

  if (rating !== undefined) {
    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return c.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: 'rating must be an integer between 1 and 5' },
        },
        400,
      );
    }
  }

  const [updated] = await db
    .update(reviews)
    .set({
      ...(rating !== undefined && { rating }),
      ...(comment !== undefined && { comment }),
    })
    .where(eq(reviews.id, id))
    .returning();

  // Recalculate avgRating
  await recalculateAvgRating(existing.toolId);

  return c.json({ success: true, data: updated, error: null });
});

// DELETE /reviews/:id — Delete own review
reviewRoutes.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const id = c.req.param('id')!;

  const [existing] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1);

  if (!existing) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Review not found' } },
      404,
    );
  }

  if (existing.userId !== user.id) {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'You can only delete your own reviews' } },
      403,
    );
  }

  await db.delete(reviews).where(eq(reviews.id, id));

  // Recalculate avgRating
  await recalculateAvgRating(existing.toolId);

  return c.json({ success: true, data: { deleted: true }, error: null });
});

export default reviewRoutes;
