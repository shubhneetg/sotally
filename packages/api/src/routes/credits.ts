import { Hono } from 'hono';
import { purchaseCreditsSchema, CREDIT_PACKAGES } from '@sotally/shared';
import { authMiddleware, type AuthUser } from '../middleware/auth';
import { getBalance, getTransactions } from '../services/credit.service';
import { createCheckoutSession } from '../services/stripe.service';

const credits = new Hono();

// GET /credits/balance
credits.get('/balance', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const balance = await getBalance(user.id);

  return c.json({
    success: true,
    data: {
      creditBalance: balance.creditBalance,
      earningsBalance: balance.earningsBalance,
    },
    error: null,
  });
});

// GET /credits/transactions
credits.get('/transactions', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const type = c.req.query('type') || undefined;

  const result = await getTransactions(user.id, page, perPage, type);

  return c.json({ success: true, data: result, error: null });
});

// POST /credits/purchase
credits.post('/purchase', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const body = await c.req.json();
  const parsed = purchaseCreditsSchema.safeParse(body);

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

  const { packageId } = parsed.data;
  const successUrl = c.req.query('success_url') || `${c.req.header('origin') || 'http://localhost:3000'}/credits/success`;
  const cancelUrl = c.req.query('cancel_url') || `${c.req.header('origin') || 'http://localhost:3000'}/credits`;

  try {
    const { url, purchaseId } = await createCheckoutSession(user.id, packageId, successUrl, cancelUrl);

    return c.json({
      success: true,
      data: { checkoutUrl: url, purchaseId },
      error: null,
    });
  } catch (err: any) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'CHECKOUT_ERROR', message: err.message },
      },
      400,
    );
  }
});

// GET /credits/packages
credits.get('/packages', async (c) => {
  return c.json({
    success: true,
    data: { packages: CREDIT_PACKAGES },
    error: null,
  });
});

export default credits;
