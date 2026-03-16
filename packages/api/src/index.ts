import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './lib/env.js';
import auth from './routes/auth.js';
import credits from './routes/credits.js';
import toolRoutes from './routes/tools.js';
import executionRoutes from './routes/executions.js';
import { handleWebhook } from './services/stripe.service.js';
import { rateLimit } from './middleware/rate-limit.js';

const app = new Hono();

// Global middleware
app.use('*', cors());
app.use('*', rateLimit({ windowMs: 60_000, maxRequests: 120 }));

// Health check
app.get('/health', (c) => c.json({ status: 'healthy', version: '0.1.0' }));

// Mount route modules
app.route('/auth', auth);
app.route('/credits', credits);
app.route('/tools', toolRoutes);
app.route('/executions', executionRoutes);

// Stripe webhook — raw body, no auth
app.post('/webhooks/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.json(
      { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'Missing stripe-signature header' } },
      400,
    );
  }

  try {
    const rawBody = await c.req.text();
    await handleWebhook(rawBody, signature);
    return c.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook] Stripe error:', err.message);
    return c.json(
      { success: false, data: null, error: { code: 'WEBHOOK_ERROR', message: 'Webhook processing failed' } },
      400,
    );
  }
});

// Global error handler
app.onError((err, c) => {
  console.error('[API] Unhandled error:', err);
  return c.json(
    {
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      },
    },
    500,
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Route not found' } },
    404,
  );
});

console.log(`[Sotally API] Starting on port 4000 (${env.NODE_ENV})`);

export default { port: 4000, fetch: app.fetch };
