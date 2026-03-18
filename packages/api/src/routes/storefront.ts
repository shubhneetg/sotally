import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { users } from '../db/schema/index';
import { authMiddleware, type AuthUser } from '../middleware/auth';

const storefrontRoutes = new Hono();

// ─── Reserved slugs ─────────────────────────────────────────────────────────

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'www', 'help', 'support', 'about', 'blog',
  'docs', 'legal', 'terms', 'privacy', 'settings', 'dashboard', 'create',
  'studio', 'onboarding', 'explore', 'search',
]);

// ─── GET /storefront/profile — Public storefront profile ────────────────────

storefrontRoutes.get('/profile', async (c) => {
  const slug = c.req.query('slug');

  if (!slug) {
    return c.json(
      { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'slug query parameter is required' } },
      400,
    );
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      bannerUrl: users.bannerUrl,
      niche: users.niche,
      followerCount: users.followerCount,
      appCount: users.appCount,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.storefrontSlug, slug))
    .limit(1);

  if (!user) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Creator not found' } },
      404,
    );
  }

  return c.json({
    success: true,
    data: user,
    error: null,
  });
});

// ─── GET /storefront/check-slug — Check slug availability ───────────────────

storefrontRoutes.get('/check-slug', authMiddleware, async (c) => {
  const slug = c.req.query('slug');

  if (!slug) {
    return c.json(
      { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'slug query parameter is required' } },
      400,
    );
  }

  const normalized = slug.toLowerCase().trim();

  // Check reserved slugs
  if (RESERVED_SLUGS.has(normalized)) {
    return c.json({ success: true, data: { available: false }, error: null });
  }

  // Check if taken by another user
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.storefrontSlug, normalized))
    .limit(1);

  return c.json({
    success: true,
    data: { available: !existing },
    error: null,
  });
});

// ─── POST /storefront/setup — Initial storefront setup (onboarding) ─────────

const setupSchema = z.object({
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(30, 'Slug must be at most 30 characters')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug must be lowercase alphanumeric with hyphens, cannot start or end with a hyphen'),
  bio: z.string().max(500).optional(),
  niche: z.string().max(100).optional(),
  displayName: z.string().max(255).optional(),
});

storefrontRoutes.post(
  '/setup',
  authMiddleware,
  zValidator('json', setupSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: result.error.flatten().fieldErrors,
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const { slug, bio, niche, displayName } = c.req.valid('json');

    const normalized = slug.toLowerCase().trim();

    // Check reserved
    if (RESERVED_SLUGS.has(normalized)) {
      return c.json(
        { success: false, data: null, error: { code: 'CONFLICT', message: 'This slug is reserved' } },
        409,
      );
    }

    // Check availability
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.storefrontSlug, normalized))
      .limit(1);

    if (existing && existing.id !== user.id) {
      return c.json(
        { success: false, data: null, error: { code: 'CONFLICT', message: 'This slug is already taken' } },
        409,
      );
    }

    // Build update payload
    const updateData: Record<string, unknown> = {
      storefrontSlug: normalized,
      onboardingComplete: true,
      updatedAt: new Date(),
    };

    if (bio !== undefined) updateData.bio = bio;
    if (niche !== undefined) updateData.niche = niche;
    if (displayName !== undefined) updateData.name = displayName;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        name: users.name,
        storefrontSlug: users.storefrontSlug,
        bio: users.bio,
        niche: users.niche,
        avatarUrl: users.avatarUrl,
        bannerUrl: users.bannerUrl,
        onboardingComplete: users.onboardingComplete,
      });

    return c.json({ success: true, data: updated, error: null });
  },
);

// ─── PATCH /storefront/profile — Update storefront profile ──────────────────

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  niche: z.string().max(100).optional(),
  websiteUrl: z.string().url().max(500).optional().nullable(),
  socialLinks: z.record(z.string()).optional(),
  bannerUrl: z.string().url().max(500).optional().nullable(),
});

storefrontRoutes.patch(
  '/profile',
  authMiddleware,
  zValidator('json', updateProfileSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: result.error.flatten().fieldErrors,
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const body = c.req.valid('json');

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.niche !== undefined) updateData.niche = body.niche;
    if (body.websiteUrl !== undefined) updateData.websiteUrl = body.websiteUrl;
    if (body.socialLinks !== undefined) updateData.socialLinks = body.socialLinks;
    if (body.bannerUrl !== undefined) updateData.bannerUrl = body.bannerUrl;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        name: users.name,
        storefrontSlug: users.storefrontSlug,
        bio: users.bio,
        niche: users.niche,
        avatarUrl: users.avatarUrl,
        bannerUrl: users.bannerUrl,
        websiteUrl: users.websiteUrl,
        socialLinks: users.socialLinks,
      });

    return c.json({ success: true, data: updated, error: null });
  },
);

export default storefrontRoutes;
