import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { authMiddleware } from '../middleware/auth';
import Redis from 'ioredis';
import { env } from '../lib/env';

const streamRoutes = new Hono();

streamRoutes.get('/executions/:id/stream', async (c) => {
  // SSE endpoints use query param auth since EventSource doesn't support headers
  const queryToken = c.req.query('token');
  const headerToken = c.req.header('authorization')?.replace('Bearer ', '');
  const token = queryToken || headerToken;

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Verify token (inline, since authMiddleware sets c.set('user'))
  const { jwtVerify } = await import('jose');
  const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);
  const verified = await jwtVerify(token, secret, { algorithms: ['HS256'] }).catch(() => null);
  if (!verified?.payload?.sub) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const executionId = c.req.param('id');

  return streamSSE(c, async (stream) => {
    const subscriber = new Redis(env.REDIS_URL);
    const channel = `execution:${executionId}`;

    let completed = false;

    subscriber.subscribe(channel, (err) => {
      if (err) {
        stream.writeSSE({ event: 'error', data: JSON.stringify({ error: 'Failed to subscribe' }) });
      }
    });

    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        const event = JSON.parse(message);
        const eventType = event.status || event.type || 'progress';
        stream.writeSSE({ event: eventType, data: message });

        if (eventType === 'completed' || eventType === 'failed' || eventType === 'error') {
          completed = true;
          subscriber.unsubscribe(channel);
          subscriber.quit();
        }
      }
    });

    // Timeout after 60 seconds
    const timeout = setTimeout(() => {
      if (!completed) {
        stream.writeSSE({ event: 'timeout', data: JSON.stringify({ error: 'Execution timed out' }) });
        subscriber.unsubscribe(channel);
        subscriber.quit();
      }
    }, 60000);

    // Wait for completion
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (completed) {
          clearInterval(check);
          clearTimeout(timeout);
          resolve();
        }
      }, 100);

      // Also resolve on timeout
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 65000);
    });
  });
});

export default streamRoutes;
