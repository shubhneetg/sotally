import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { appData, apps } from '../db/schema/index';
import { optionalAuthMiddleware, type AuthUser } from '../middleware/auth';

const appDataRoutes = new Hono();

// All app-data routes use optional auth (apps can store data for anon users too)
appDataRoutes.use('*', optionalAuthMiddleware);

// ─── Helpers ────────────────────────────────────────────────────────────────

const MAX_VALUE_SIZE = 100 * 1024; // 100KB

function getUserId(c: any): string | null {
  const user = c.get('user') as AuthUser | undefined;
  return user?.id ?? null;
}

function buildLookupConditions(appId: string, userId: string | null, namespace: string, key: string) {
  return and(
    eq(appData.appId, appId),
    userId ? eq(appData.userId, userId) : sql`${appData.userId} IS NULL`,
    eq(appData.namespace, namespace),
    eq(appData.key, key),
  );
}

// ─── GET /app-data/apps/:appId/data — Read a value ─────────────────────────

appDataRoutes.get('/apps/:appId/data', async (c) => {
  const appId = c.req.param('appId')!;
  const key = c.req.query('key');
  const namespace = c.req.query('namespace') || 'default';
  const userId = getUserId(c);

  if (!key) {
    return c.json(
      { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'key query parameter is required' } },
      400,
    );
  }

  const [record] = await db
    .select({ value: appData.value, updatedAt: appData.updatedAt })
    .from(appData)
    .where(buildLookupConditions(appId, userId, namespace, key))
    .limit(1);

  return c.json({
    success: true,
    data: record || { value: null, updatedAt: null },
    error: null,
  });
});

// ─── PUT /app-data/apps/:appId/data — Upsert a value ───────────────────────

const putDataSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.any(),
  namespace: z.string().max(100).optional(),
});

appDataRoutes.put(
  '/apps/:appId/data',
  zValidator('json', putDataSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.flatten().fieldErrors },
        },
        400,
      );
    }
  }),
  async (c) => {
    const appId = c.req.param('appId')!;
    const userId = getUserId(c);
    const { key, value, namespace } = c.req.valid('json');
    const ns = namespace || 'default';

    // Size check
    const serialized = JSON.stringify(value);
    if (serialized.length > MAX_VALUE_SIZE) {
      return c.json(
        { success: false, data: null, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Value exceeds 100KB limit' } },
        413,
      );
    }

    // Verify the app exists
    const [app] = await db
      .select({ id: apps.id })
      .from(apps)
      .where(eq(apps.id, appId))
      .limit(1);

    if (!app) {
      return c.json(
        { success: false, data: null, error: { code: 'NOT_FOUND', message: 'App not found' } },
        404,
      );
    }

    const now = new Date();

    const [result] = await db
      .insert(appData)
      .values({
        appId,
        userId,
        namespace: ns,
        key,
        value,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [appData.appId, appData.userId, appData.namespace, appData.key],
        set: { value, updatedAt: now },
      })
      .returning();

    return c.json({ success: true, data: result, error: null });
  },
);

// ─── DELETE /app-data/apps/:appId/data — Delete a value ─────────────────────

appDataRoutes.delete('/apps/:appId/data', async (c) => {
  const appId = c.req.param('appId')!;
  const key = c.req.query('key');
  const namespace = c.req.query('namespace') || 'default';
  const userId = getUserId(c);

  if (!key) {
    return c.json(
      { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'key query parameter is required' } },
      400,
    );
  }

  await db
    .delete(appData)
    .where(buildLookupConditions(appId, userId, namespace, key));

  return c.json({ success: true, data: null, error: null });
});

// ─── GET /app-data/apps/:appId/data/list — List keys ────────────────────────

appDataRoutes.get('/apps/:appId/data/list', async (c) => {
  const appId = c.req.param('appId')!;
  const namespace = c.req.query('namespace') || 'default';
  const prefix = c.req.query('prefix');
  const userId = getUserId(c);

  const conditions = [
    eq(appData.appId, appId),
    userId ? eq(appData.userId, userId) : sql`${appData.userId} IS NULL`,
    eq(appData.namespace, namespace),
  ];

  if (prefix) {
    conditions.push(sql`${appData.key} LIKE ${prefix + '%'}`);
  }

  const items = await db
    .select({
      key: appData.key,
      updatedAt: appData.updatedAt,
    })
    .from(appData)
    .where(and(...conditions))
    .orderBy(appData.key)
    .limit(1000);

  return c.json({ success: true, data: items, error: null });
});

export default appDataRoutes;
