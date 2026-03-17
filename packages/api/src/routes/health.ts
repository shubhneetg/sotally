import { Hono } from 'hono';
import { db } from '../db/client';
import { redis } from '../lib/redis';
import { executionQueue } from '../lib/queue';
import { sql } from 'drizzle-orm';

const healthRoutes = new Hono();

healthRoutes.get('/', async (c) => {
  const services: Record<string, string> = {
    database: 'unknown',
    redis: 'unknown',
    queue: 'unknown',
  };

  // Check database connectivity
  try {
    await db.execute(sql`SELECT 1`);
    services.database = 'connected';
  } catch (err) {
    services.database = 'disconnected';
  }

  // Check Redis connectivity
  try {
    const pong = await redis.ping();
    services.redis = pong === 'PONG' ? 'connected' : 'disconnected';
  } catch (err) {
    services.redis = 'disconnected';
  }

  // Check BullMQ queue
  try {
    const isPaused = await executionQueue.isPaused();
    services.queue = isPaused ? 'paused' : 'ready';
  } catch (err) {
    services.queue = 'disconnected';
  }

  const allHealthy = Object.values(services).every(
    (s) => s === 'connected' || s === 'ready',
  );

  const status = allHealthy ? 'healthy' : 'degraded';
  const statusCode = allHealthy ? 200 : 503;

  return c.json(
    {
      status,
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      services,
    },
    statusCode,
  );
});

export default healthRoutes;
