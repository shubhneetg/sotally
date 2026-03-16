import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { registerSchema, loginSchema, SIGNUP_BONUS } from '@sotally/shared';
import { db } from '../db/client.js';
import { users } from '../db/schema/index.js';
import { env } from '../lib/env.js';
import { authMiddleware, type AuthUser } from '../middleware/auth.js';
import { grantCredits } from '../services/credit.service.js';

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
auth.post('/register', async (c) => {
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

  const { email, password, name } = parsed.data;

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

  const passwordHash = await hashPassword(password);
  const referralCode = generateReferralCode();

  const [user] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      referralCode,
      role: 'buyer',
      creditBalance: 0,
      earningsBalance: 0,
    })
    .returning();

  // Grant signup bonus credits
  await grantCredits(user.id, SIGNUP_BONUS, 'signup_bonus', `Welcome bonus: ${SIGNUP_BONUS} credits`);

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
auth.post('/login', async (c) => {
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

export default auth;
