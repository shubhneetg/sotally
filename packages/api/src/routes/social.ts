import { Hono } from 'hono';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { follows, appLikes, apps, users } from '../db/schema/index';
import { authMiddleware, type AuthUser } from '../middleware/auth';
import { env } from '../lib/env';

const socialRoutes = new Hono();

// All social routes require auth
socialRoutes.use('*', authMiddleware);

// ─── POST /social/follow/:creatorId — Follow a creator ───────────────────────

socialRoutes.post('/follow/:creatorId', async (c) => {
  const user = c.get('user') as AuthUser;
  const creatorId = c.req.param('creatorId')!;

  if (user.id === creatorId) {
    return c.json(
      { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'Cannot follow yourself' } },
      400,
    );
  }

  // Verify creator exists
  const [creator] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, creatorId))
    .limit(1);

  if (!creator) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Creator not found' } },
      404,
    );
  }

  // Check if already following
  const [existing] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, user.id), eq(follows.creatorId, creatorId)))
    .limit(1);

  if (existing) {
    return c.json(
      { success: false, data: null, error: { code: 'CONFLICT', message: 'Already following this creator' } },
      409,
    );
  }

  // Insert follow and update counts
  await db.insert(follows).values({ followerId: user.id, creatorId });

  await Promise.all([
    db
      .update(users)
      .set({ followerCount: sql`${users.followerCount} + 1`, updatedAt: new Date() })
      .where(eq(users.id, creatorId)),
    db
      .update(users)
      .set({ followingCount: sql`${users.followingCount} + 1`, updatedAt: new Date() })
      .where(eq(users.id, user.id)),
  ]);

  return c.json({ success: true, data: { following: true }, error: null }, 201);
});

// ─── DELETE /social/follow/:creatorId — Unfollow a creator ───────────────────

socialRoutes.delete('/follow/:creatorId', async (c) => {
  const user = c.get('user') as AuthUser;
  const creatorId = c.req.param('creatorId')!;

  const [existing] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, user.id), eq(follows.creatorId, creatorId)))
    .limit(1);

  if (!existing) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Not following this creator' } },
      404,
    );
  }

  await db
    .delete(follows)
    .where(and(eq(follows.followerId, user.id), eq(follows.creatorId, creatorId)));

  await Promise.all([
    db
      .update(users)
      .set({ followerCount: sql`GREATEST(${users.followerCount} - 1, 0)`, updatedAt: new Date() })
      .where(eq(users.id, creatorId)),
    db
      .update(users)
      .set({ followingCount: sql`GREATEST(${users.followingCount} - 1, 0)`, updatedAt: new Date() })
      .where(eq(users.id, user.id)),
  ]);

  return c.json({ success: true, data: { following: false }, error: null });
});

// ─── GET /social/following — List creators the user follows ──────────────────

socialRoutes.get('/following', async (c) => {
  const user = c.get('user') as AuthUser;
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const followRows = await db
    .select({
      creatorId: follows.creatorId,
      followedAt: follows.createdAt,
    })
    .from(follows)
    .where(eq(follows.followerId, user.id))
    .orderBy(desc(follows.createdAt))
    .limit(limit)
    .offset(offset);

  if (followRows.length === 0) {
    return c.json({ success: true, data: [], error: null });
  }

  const creatorIds = followRows.map((f) => f.creatorId);

  const creators = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      storefrontSlug: users.storefrontSlug,
      bio: users.bio,
      niche: users.niche,
      followerCount: users.followerCount,
      appCount: users.appCount,
    })
    .from(users)
    .where(sql`${users.id} IN ${creatorIds}`);

  const creatorMap = new Map(creators.map((cr) => [cr.id, cr]));

  const enriched = followRows.map((row) => ({
    ...creatorMap.get(row.creatorId),
    followedAt: row.followedAt,
  }));

  return c.json({ success: true, data: enriched, error: null });
});

// ─── POST /social/like/:appId — Like an app ─────────────────────────────────

socialRoutes.post('/like/:appId', async (c) => {
  const user = c.get('user') as AuthUser;
  const appId = c.req.param('appId')!;

  // Verify app exists and is published
  const [app] = await db
    .select({ id: apps.id, status: apps.status })
    .from(apps)
    .where(eq(apps.id, appId))
    .limit(1);

  if (!app || (app.status !== 'published' && app.status !== 'unlisted')) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'App not found' } },
      404,
    );
  }

  // Check if already liked
  const [existing] = await db
    .select()
    .from(appLikes)
    .where(and(eq(appLikes.userId, user.id), eq(appLikes.appId, appId)))
    .limit(1);

  if (existing) {
    return c.json(
      { success: false, data: null, error: { code: 'CONFLICT', message: 'Already liked this app' } },
      409,
    );
  }

  await db.insert(appLikes).values({ userId: user.id, appId });

  await db
    .update(apps)
    .set({ likeCount: sql`${apps.likeCount} + 1`, updatedAt: new Date() })
    .where(eq(apps.id, appId));

  return c.json({ success: true, data: { liked: true }, error: null }, 201);
});

// ─── DELETE /social/like/:appId — Unlike an app ─────────────────────────────

socialRoutes.delete('/like/:appId', async (c) => {
  const user = c.get('user') as AuthUser;
  const appId = c.req.param('appId')!;

  const [existing] = await db
    .select()
    .from(appLikes)
    .where(and(eq(appLikes.userId, user.id), eq(appLikes.appId, appId)))
    .limit(1);

  if (!existing) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Not liked' } },
      404,
    );
  }

  await db
    .delete(appLikes)
    .where(and(eq(appLikes.userId, user.id), eq(appLikes.appId, appId)));

  await db
    .update(apps)
    .set({ likeCount: sql`GREATEST(${apps.likeCount} - 1, 0)`, updatedAt: new Date() })
    .where(eq(apps.id, appId));

  return c.json({ success: true, data: { liked: false }, error: null });
});

// ─── GET /social/feed — Activity feed from followed creators ─────────────────

socialRoutes.get('/feed', async (c) => {
  const user = c.get('user') as AuthUser;
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 50);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  // Get IDs of followed creators
  const followedRows = await db
    .select({ creatorId: follows.creatorId })
    .from(follows)
    .where(eq(follows.followerId, user.id));

  const followedIds = followedRows.map((f) => f.creatorId);

  if (followedIds.length === 0) {
    return c.json({ success: true, data: [], error: null });
  }

  // Fetch recent published apps from followed creators
  const items = await db
    .select({
      id: apps.id,
      slug: apps.slug,
      name: apps.name,
      description: apps.description,
      iconUrl: apps.iconUrl,
      niche: apps.niche,
      pricingModel: apps.pricingModel,
      totalSessions: apps.totalSessions,
      totalUsers: apps.totalUsers,
      likeCount: apps.likeCount,
      avgRating: apps.avgRating,
      publishedAt: apps.publishedAt,
      creatorId: apps.creatorId,
    })
    .from(apps)
    .where(and(sql`${apps.creatorId} IN ${followedIds}`, eq(apps.status, 'published')))
    .orderBy(desc(apps.publishedAt))
    .limit(limit)
    .offset(offset);

  // Fetch creator info
  const creatorIds = [...new Set(items.map((a) => a.creatorId))];
  const creators =
    creatorIds.length > 0
      ? await db
          .select({
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
            storefrontSlug: users.storefrontSlug,
          })
          .from(users)
          .where(sql`${users.id} IN ${creatorIds}`)
      : [];

  const creatorMap = new Map(creators.map((cr) => [cr.id, cr]));

  // Check which apps the user has liked
  const appIds = items.map((a) => a.id);
  const likedRows =
    appIds.length > 0
      ? await db
          .select({ appId: appLikes.appId })
          .from(appLikes)
          .where(and(eq(appLikes.userId, user.id), sql`${appLikes.appId} IN ${appIds}`))
      : [];

  const likedSet = new Set(likedRows.map((r) => r.appId));

  const enriched = items.map((item) => ({
    ...item,
    creator: creatorMap.get(item.creatorId) || null,
    liked: likedSet.has(item.id),
  }));

  return c.json({ success: true, data: enriched, error: null });
});

// ─── POST /social/share/:appId — Record share event and return URL ───────────

socialRoutes.post('/share/:appId', async (c) => {
  const appId = c.req.param('appId')!;

  // Fetch app and creator info to build shareable URL
  const [app] = await db
    .select({
      id: apps.id,
      slug: apps.slug,
      name: apps.name,
      creatorId: apps.creatorId,
      status: apps.status,
    })
    .from(apps)
    .where(eq(apps.id, appId))
    .limit(1);

  if (!app || (app.status !== 'published' && app.status !== 'unlisted')) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'App not found' } },
      404,
    );
  }

  const [creator] = await db
    .select({ storefrontSlug: users.storefrontSlug })
    .from(users)
    .where(eq(users.id, app.creatorId))
    .limit(1);

  const baseUrl = env.FRONTEND_URL || 'https://sotally.com';
  const shareUrl = creator?.storefrontSlug
    ? `${baseUrl}/${creator.storefrontSlug}/${app.slug}`
    : `${baseUrl}/apps/${app.id}`;

  return c.json({
    success: true,
    data: { shareUrl, appName: app.name },
    error: null,
  });
});

export default socialRoutes;
