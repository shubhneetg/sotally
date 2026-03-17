import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { registerSchema, loginSchema, SIGNUP_BONUS } from '@sotally/shared';
import { db } from '../db/client';
import { users } from '../db/schema/index';
import { env } from '../lib/env';
import { authMiddleware, type AuthUser } from '../middleware/auth';
import { grantCredits } from '../services/credit.service';
import { rateLimit } from '../middleware/rate-limit';
import { trackAffiliateReferral } from '../middleware/affiliate-tracking';

const scryptAsync = promisify(scrypt);
const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const keyBuffer = Buffer.from(key, 'hex');
  return timingSafeEqual(derived, keyBuffer);
}

function generateReferralCode(): string {
  return randomBytes(6).toString('base64url');
}

async function createJwt(user: { id: string; email: string; role: string }): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

const auth = new Hono();

// POST /auth/register
auth.post('/register', rateLimit({ windowMs: 60_000, maxRequests: 5, keyPrefix: 'rl:register' }), async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      400,
    );
  }

  const { email, password, name, referralCode: incomingReferralCode } = parsed.data;

  // Check for existing user
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' },
      },
      409,
    );
  }

  // Look up referring user if referral code provided
  let referrerId: string | null = null;
  if (incomingReferralCode) {
    const [referrer] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, incomingReferralCode))
      .limit(1);
    if (referrer) {
      referrerId = referrer.id;
    }
  }

  const passwordHash = await hashPassword(password);
  const referralCode = generateReferralCode();

  const [user] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      referralCode,
      referredBy: referrerId,
      role: 'buyer',
      creditBalance: 0,
      earningsBalance: 0,
    })
    .returning();

  // Grant signup bonus credits
  await grantCredits(user.id, SIGNUP_BONUS, 'signup_bonus', `Welcome bonus: ${SIGNUP_BONUS} credits`);

  // Grant referral bonus to the referring user
  if (referrerId) {
    await grantCredits(referrerId, 50, 'referral_bonus', `Referral bonus: ${user.email} signed up`, user.id, 'referral');
  }

  // Track affiliate referral (separate from user-to-user referral bonus)
  if (incomingReferralCode) {
    await trackAffiliateReferral(incomingReferralCode, user.id);
  }

  const token = await createJwt({ id: user.id, email: user.email, role: user.role });

  return c.json(
    {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          creditBalance: SIGNUP_BONUS,
        },
      },
      error: null,
    },
    201,
  );
});

// POST /auth/login
auth.post('/login', rateLimit({ windowMs: 60_000, maxRequests: 10, keyPrefix: 'rl:login' }), async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      400,
    );
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user || !user.passwordHash) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      },
      401,
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      },
      401,
    );
  }

  const token = await createJwt({ id: user.id, email: user.email, role: user.role });

  return c.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        creditBalance: user.creditBalance,
      },
    },
    error: null,
  });
});

// GET /auth/me
auth.get('/me', authMiddleware, async (c) => {
  const authUser = c.get('user') as AuthUser;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      creditBalance: users.creditBalance,
      earningsBalance: users.earningsBalance,
      referralCode: users.referralCode,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!user) {
    return c.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'User not found' } },
      404,
    );
  }

  return c.json({ success: true, data: { user }, error: null });
});

// POST /auth/logout
auth.post('/logout', authMiddleware, async (c) => {
  // JWT is stateless — client just deletes the token
  // But we can log the event for analytics
  return c.json({ success: true, data: { message: 'Logged out successfully' }, error: null });
});

export default auth;
