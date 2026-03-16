import type { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import { env } from '../lib/env.js';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);

async function extractAndVerifyToken(c: Context): Promise<AuthUser | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (!payload.sub || !payload.email) {
      return null;
    }

    return {
      id: payload.sub as string,
      email: payload.email as string,
      role: (payload.role as string) || 'buyer',
    };
  } catch {
    return null;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const user = await extractAndVerifyToken(c);

  if (!user) {
    return c.json(
      { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Valid authentication required' } },
      401,
    );
  }

  c.set('user', user);
  await next();
}

export async function optionalAuthMiddleware(c: Context, next: Next) {
  const user = await extractAndVerifyToken(c);

  if (user) {
    c.set('user', user);
  }

  await next();
}
