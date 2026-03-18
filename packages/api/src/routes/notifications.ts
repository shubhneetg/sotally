import { Hono } from 'hono';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { notifications } from '../db/schema/index';
import { authMiddleware, type AuthUser } from '../middleware/auth';

const notificationRoutes = new Hono();

// All notification routes require auth
notificationRoutes.use('*', authMiddleware);

// ─── Helper: create a notification ───────────────────────────────────────────

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body?: string,
  data?: Record<string, unknown>,
) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title,
      body: body ?? null,
      data: data ?? null,
    })
    .returning();

  // Future: push via WebSocket here
  return notification;
}

// ─── GET /notifications — List user's notifications (paginated) ──────────────

notificationRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser;
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 50);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const [items, countResult, unreadCountResult] = await Promise.all([
    db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        data: notifications.data,
        read: notifications.read,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(eq(notifications.userId, user.id)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false))),
  ]);

  const total = countResult[0]?.count ?? 0;
  const unreadCount = unreadCountResult[0]?.count ?? 0;

  return c.json({
    success: true,
    data: {
      items,
      total,
      unreadCount,
      limit,
      offset,
    },
    error: null,
  });
});

// ─── PATCH /notifications/:id/read — Mark a notification as read ─────────────

notificationRoutes.patch('/:id/read', async (c) => {
  const user = c.get('user') as AuthUser;
  const notificationId = c.req.param('id')!;

  const [updated] = await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)))
    .returning();

  if (!updated) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Notification not found' } },
      404,
    );
  }

  return c.json({ success: true, data: updated, error: null });
});

// ─── POST /notifications/read-all — Mark all notifications as read ───────────

notificationRoutes.post('/read-all', async (c) => {
  const user = c.get('user') as AuthUser;

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));

  return c.json({ success: true, data: { readAll: true }, error: null });
});

export default notificationRoutes;
