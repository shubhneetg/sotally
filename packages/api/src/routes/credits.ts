import { Hono } from 'hono';
import { eq, and, gte } from 'drizzle-orm';
import { purchaseCreditsSchema, CREDIT_PACKAGES } from '@sotally/shared';
import { authMiddleware, type AuthUser } from '../middleware/auth';
import { getBalance, getTransactions, grantCredits } from '../services/credit.service';
import { createCheckoutSession } from '../services/stripe.service';
import { db } from '../db/client';
import { creditTransactions } from '../db/schema/index';

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

// POST /credits/claim-daily — grant 5 free credits per day per user
credits.post('/claim-daily', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;

  // Check if already claimed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const claimed = await db.select()
    .from(creditTransactions)
    .where(and(
      eq(creditTransactions.userId, user.id),
      eq(creditTransactions.type, 'signup_bonus'),
      gte(creditTransactions.createdAt, today)
    ))
    .limit(1);

  if (claimed.length > 0) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'ALREADY_CLAIMED', message: 'Daily credits already claimed today' },
      },
      400,
    );
  }

  // Grant 5 credits
  await grantCredits(user.id, 5, 'signup_bonus', 'Daily free credits');

  return c.json({ success: true, data: { creditsGranted: 5 }, error: null });
});

export default credits;
