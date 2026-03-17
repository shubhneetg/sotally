import { Hono } from 'hono';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../db/client';
import { bounties, bountySubmissions, users, tools } from '../db/schema/index';
import { authMiddleware, optionalAuthMiddleware, type AuthUser } from '../middleware/auth';
import { holdCredits } from '../services/credit.service';

const bountyRoutes = new Hono();

// GET /bounties — list open bounties
bountyRoutes.get('/', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(50, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;
  const status = c.req.query('status') || 'open';

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: bounties.id,
        title: bounties.title,
        description: bounties.description,
        creditReward: bounties.creditReward,
        status: bounties.status,
        requesterId: bounties.requesterId,
        requesterName: users.name,
        createdAt: bounties.createdAt,
      })
      .from(bounties)
      .leftJoin(users, eq(bounties.requesterId, users.id))
      .where(eq(bounties.status, status))
      .orderBy(desc(bounties.createdAt))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bounties)
      .where(eq(bounties.status, status)),
  ]);

  const total = countResult[0]?.count ?? 0;

  return c.json({
    success: true,
    data: { items, total, page, pageSize: perPage, totalPages: Math.ceil(total / perPage) },
    error: null,
  });
});

// All remaining bounty routes require auth
bountyRoutes.use('*', authMiddleware);

// POST /bounties — create a bounty (holds credits as reward)
bountyRoutes.post('/', async (c) => {
  const user = c.get('user') as AuthUser;
  const { title, description, creditReward } = await c.req.json();

  if (!title || !description || !creditReward || creditReward < 5) {
    return c.json(
      { success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Title, description, and reward (min 5 credits) required' } },
      400,
    );
  }

  // Hold credits for the bounty reward
  const hold = await holdCredits(user.id, creditReward, 'bounty', 'bounty');
  if (!hold.success) {
    return c.json(
      { success: false, data: null, error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits for bounty reward' } },
      402,
    );
  }

  const [bounty] = await db
    .insert(bounties)
    .values({
      requesterId: user.id,
      title,
      description,
      creditReward,
      status: 'open',
    })
    .returning();

  return c.json({ success: true, data: bounty, error: null }, 201);
});

// POST /bounties/:id/submit — creator submits a tool for a bounty
bountyRoutes.post('/:id/submit', async (c) => {
  const user = c.get('user') as AuthUser;
  const bountyId = c.req.param('id')!;
  const { toolId, message } = await c.req.json();

  const [bounty] = await db
    .select()
    .from(bounties)
    .where(and(eq(bounties.id, bountyId), eq(bounties.status, 'open')))
    .limit(1);

  if (!bounty) {
    return c.json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Bounty not found or not open' } }, 404);
  }

  if (bounty.requesterId === user.id) {
    return c.json({ success: false, data: null, error: { code: 'BAD_REQUEST', message: 'Cannot submit to your own bounty' } }, 400);
  }

  // Verify tool exists and is published
  const [tool] = await db
    .select({ id: tools.id, creatorId: tools.creatorId })
    .from(tools)
    .where(and(eq(tools.id, toolId), eq(tools.status, 'published')))
    .limit(1);

  if (!tool || tool.creatorId !== user.id) {
    return c.json({ success: false, data: null, error: { code: 'BAD_REQUEST', message: 'Tool not found or not owned by you' } }, 400);
  }

  const [submission] = await db
    .insert(bountySubmissions)
    .values({
      bountyId,
      creatorId: user.id,
      toolId,
      message: message || null,
    })
    .returning();

  return c.json({ success: true, data: submission, error: null }, 201);
});

// POST /bounties/:id/accept — requester accepts a submission
bountyRoutes.post('/:id/accept', async (c) => {
  const user = c.get('user') as AuthUser;
  const bountyId = c.req.param('id')!;
  const { submissionId } = await c.req.json();

  const [bounty] = await db
    .select()
    .from(bounties)
    .where(and(eq(bounties.id, bountyId), eq(bounties.requesterId, user.id), eq(bounties.status, 'open')))
    .limit(1);

  if (!bounty) {
    return c.json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Bounty not found' } }, 404);
  }

  const [submission] = await db
    .select()
    .from(bountySubmissions)
    .where(and(eq(bountySubmissions.id, submissionId), eq(bountySubmissions.bountyId, bountyId)))
    .limit(1);

  if (!submission) {
    return c.json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Submission not found' } }, 404);
  }

  // Transfer credits to creator
  await db
    .update(users)
    .set({ earningsBalance: sql`${users.earningsBalance} + ${bounty.creditReward}` })
    .where(eq(users.id, submission.creatorId));

  // Mark bounty completed
  await db
    .update(bounties)
    .set({
      status: 'completed',
      claimedBy: submission.creatorId,
      fulfilledByToolId: submission.toolId,
      updatedAt: new Date(),
    })
    .where(eq(bounties.id, bountyId));

  // Mark submission accepted
  await db
    .update(bountySubmissions)
    .set({ status: 'accepted' })
    .where(eq(bountySubmissions.id, submissionId));

  return c.json({ success: true, data: { message: 'Bounty completed, credits transferred' }, error: null });
});

// POST /bounties/:id/cancel — requester cancels bounty (refunds credits)
bountyRoutes.post('/:id/cancel', async (c) => {
  const user = c.get('user') as AuthUser;
  const bountyId = c.req.param('id')!;

  const [bounty] = await db
    .select()
    .from(bounties)
    .where(and(eq(bounties.id, bountyId), eq(bounties.requesterId, user.id), eq(bounties.status, 'open')))
    .limit(1);

  if (!bounty) {
    return c.json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Bounty not found' } }, 404);
  }

  // Refund credits
  await db
    .update(users)
    .set({ creditBalance: sql`${users.creditBalance} + ${bounty.creditReward}` })
    .where(eq(users.id, user.id));

  await db
    .update(bounties)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(bounties.id, bountyId));

  return c.json({ success: true, data: { message: 'Bounty cancelled, credits refunded' }, error: null });
});

export default bountyRoutes;
