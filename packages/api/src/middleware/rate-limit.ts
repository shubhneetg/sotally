import type { Context, Next } from 'hono';
import { redis } from '../lib/redis';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 60,
  keyPrefix: 'rl',
};

function getClientKey(c: Context): string {
  const user = c.get('user') as { id: string } | undefined;
  if (user) {
    return `user:${user.id}`;
  }
  const forwarded = c.req.header('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `ip:${ip}`;
}

export function rateLimit(config?: Partial<RateLimitConfig>) {
  const { windowMs, maxRequests, keyPrefix } = { ...defaultConfig, ...config };
  const windowSec = Math.ceil(windowMs / 1000);

  return async (c: Context, next: Next) => {
    const clientKey = getClientKey(c);
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `${keyPrefix}:${clientKey}`;

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
    pipeline.zcard(redisKey);
    pipeline.expire(redisKey, windowSec);

    const results = await pipeline.exec();
    const requestCount = (results?.[2]?.[1] as number) || 0;

    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - requestCount)));
    c.header('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));

    if (requestCount > maxRequests) {
      const retryAfter = Math.ceil(windowMs / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        {
          success: false,
          data: null,
          error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
        },
        429,
      );
    }

    await next();
  };
}
