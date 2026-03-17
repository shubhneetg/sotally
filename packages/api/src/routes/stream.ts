import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { authMiddleware } from '../middleware/auth';
import Redis from 'ioredis';
import { env } from '../lib/env';

const streamRoutes = new Hono();

streamRoutes.get('/executions/:id/stream', authMiddleware, async (c) => {
  const executionId = c.req.param('id');
  const user = c.get('user');

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
        stream.writeSSE({ event: event.type || 'progress', data: message });

        if (event.type === 'completed' || event.type === 'failed' || event.type === 'error') {
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
