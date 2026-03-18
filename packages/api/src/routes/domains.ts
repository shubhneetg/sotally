import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { customDomains, users } from '../db/schema/index';
import { authMiddleware, type AuthUser } from '../middleware/auth';
import { randomBytes } from 'crypto';

const domainRoutes = new Hono();

// All routes require auth
domainRoutes.use('*', authMiddleware);

// ─── POST /domains — Add custom domain for creator storefront ───────────────

const addDomainSchema = z.object({
  domain: z.string().min(1, 'Domain is required').max(500),
});

domainRoutes.post(
  '/',
  zValidator('json', addDomainSchema, (result, c) => {
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
    const { domain } = c.req.valid('json');

    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim();

    if (!cleanDomain || !cleanDomain.includes('.')) {
      return c.json(
        { success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid domain format' } },
        400,
      );
    }

    // Check uniqueness
    const [existing] = await db
      .select({ id: customDomains.id })
      .from(customDomains)
      .where(eq(customDomains.domain, cleanDomain))
      .limit(1);

    if (existing) {
      return c.json(
        { success: false, data: null, error: { code: 'CONFLICT', message: 'Domain already registered' } },
        409,
      );
    }

    // Generate a TXT record verification token
    const verificationToken = `sotally-verify-${randomBytes(16).toString('hex')}`;

    const [created] = await db
      .insert(customDomains)
      .values({
        creatorId: user.id,
        domain: cleanDomain,
      })
      .returning();

    // Store verification token in a separate update (the schema uses boolean verified,
    // so we return instructions alongside the domain record)
    return c.json(
      {
        success: true,
        data: {
          ...created,
          verification: {
            type: 'CNAME',
            host: cleanDomain,
            value: 'storefront.sotally.com',
            txtRecord: {
              host: `_sotally.${cleanDomain}`,
              value: verificationToken,
            },
            instructions: `Add a CNAME record pointing ${cleanDomain} to storefront.sotally.com, and a TXT record at _sotally.${cleanDomain} with value ${verificationToken}`,
          },
        },
        error: null,
      },
      201,
    );
  },
);

// ─── GET /domains — List creator's custom domains ───────────────────────────

domainRoutes.get('/', async (c) => {
  const user = c.get('user') as AuthUser;

  const domains = await db
    .select()
    .from(customDomains)
    .where(eq(customDomains.creatorId, user.id));

  const enriched = domains.map((d) => ({
    ...d,
    status: d.verified ? 'active' : 'pending',
  }));

  return c.json({ success: true, data: enriched, error: null });
});

// ─── DELETE /domains/:id — Remove a domain ──────────────────────────────────

domainRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const domainId = c.req.param('id')!;

  const [domain] = await db
    .select({ id: customDomains.id, creatorId: customDomains.creatorId })
    .from(customDomains)
    .where(eq(customDomains.id, domainId))
    .limit(1);

  if (!domain) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Domain not found' } },
      404,
    );
  }

  if (domain.creatorId !== user.id) {
    return c.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'You do not own this domain' } },
      403,
    );
  }

  await db
    .delete(customDomains)
    .where(and(eq(customDomains.id, domainId), eq(customDomains.creatorId, user.id)));

  return c.json({ success: true, data: null, error: null });
});

// ─── GET /domains/verify/:id — Check DNS verification status ────────────────

domainRoutes.get('/verify/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const domainId = c.req.param('id')!;

  const [domain] = await db
    .select()
    .from(customDomains)
    .where(and(eq(customDomains.id, domainId), eq(customDomains.creatorId, user.id)))
    .limit(1);

  if (!domain) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Domain not found' } },
      404,
    );
  }

  if (domain.verified) {
    return c.json({
      success: true,
      data: { ...domain, status: 'active', verified: true },
      error: null,
    });
  }

  // Attempt DNS verification via CNAME lookup
  let cnameVerified = false;
  try {
    const { resolve } = await import('dns/promises');
    const records = await resolve(domain.domain, 'CNAME');
    cnameVerified = records.some((r) =>
      r.toLowerCase().includes('sotally.com'),
    );
  } catch {
    // DNS lookup failed — not yet configured
  }

  if (cnameVerified) {
    // Mark as verified
    await db
      .update(customDomains)
      .set({ verified: true })
      .where(eq(customDomains.id, domainId));

    return c.json({
      success: true,
      data: { ...domain, status: 'active', verified: true },
      error: null,
    });
  }

  return c.json({
    success: true,
    data: {
      ...domain,
      status: 'pending',
      verified: false,
      instructions: `Add a CNAME record pointing ${domain.domain} to storefront.sotally.com`,
    },
    error: null,
  });
});

export default domainRoutes;
