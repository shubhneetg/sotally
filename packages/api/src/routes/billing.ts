import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and } from 'drizzle-orm';
import Stripe from 'stripe';
import { db } from '../db/client';
import { apps, users, toolLicenses } from '../db/schema/index';
import { authMiddleware, type AuthUser } from '../middleware/auth';
import { env } from '../lib/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia' as any,
});

const billingRoutes = new Hono();

// ─── POST /billing/checkout — Create Stripe Checkout for app purchase ────────

const checkoutSchema = z.object({
  appId: z.string().uuid('Invalid app ID'),
});

billingRoutes.post(
  '/checkout',
  authMiddleware,
  zValidator('json', checkoutSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: result.error.flatten().fieldErrors,
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const { appId } = c.req.valid('json');

    // Fetch the app
    const [app] = await db
      .select({
        id: apps.id,
        name: apps.name,
        pricingModel: apps.pricingModel,
        priceAmountCents: apps.priceAmountCents,
        creatorId: apps.creatorId,
        status: apps.status,
      })
      .from(apps)
      .where(eq(apps.id, appId))
      .limit(1);

    if (!app) {
      return c.json(
        { success: false, data: null, error: { code: 'NOT_FOUND', message: 'App not found' } },
        404,
      );
    }

    if (app.status !== 'published') {
      return c.json(
        { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'App is not available for purchase' } },
        400,
      );
    }

    if (app.pricingModel === 'free') {
      return c.json(
        { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'This app is free' } },
        400,
      );
    }

    if (!app.priceAmountCents || app.priceAmountCents <= 0) {
      return c.json(
        { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'App has no price set' } },
        400,
      );
    }

    // Check if already purchased
    const [existing] = await db
      .select({ id: toolLicenses.id })
      .from(toolLicenses)
      .where(and(eq(toolLicenses.userId, user.id), eq(toolLicenses.toolId, appId)))
      .limit(1);

    if (existing) {
      return c.json(
        { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'You already own this app' } },
        400,
      );
    }

    // Fetch creator's Stripe Connect ID for destination charge
    const [creator] = await db
      .select({ stripeConnectId: users.stripeConnectId })
      .from(users)
      .where(eq(users.id, app.creatorId))
      .limit(1);

    const frontendUrl = env.FRONTEND_URL || 'https://sotally.com';
    const successUrl = `${frontendUrl}/dashboard?purchase=success&app=${appId}`;
    const cancelUrl = `${frontendUrl}/dashboard?purchase=cancelled`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: app.name,
              description: `One-time purchase of ${app.name} on Sotally`,
            },
            unit_amount: app.priceAmountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'app_purchase',
        appId: app.id,
        userId: user.id,
        creatorId: app.creatorId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    // If creator has Stripe Connect, use destination charge
    if (creator?.stripeConnectId) {
      const platformFeeCents = Math.round(app.priceAmountCents * 0.15);
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: creator.stripeConnectId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return c.json({
      success: true,
      data: { url: session.url },
      error: null,
    });
  },
);

// ─── POST /billing/subscribe — Create platform subscription checkout ─────────

const subscribeSchema = z.object({
  tier: z.enum(['pro', 'business']),
});

billingRoutes.post(
  '/subscribe',
  authMiddleware,
  zValidator('json', subscribeSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: result.error.flatten().fieldErrors,
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const { tier } = c.req.valid('json');

    // Check current plan
    const [currentUser] = await db
      .select({ planTier: users.planTier, stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (currentUser?.planTier === tier) {
      return c.json(
        { success: false, data: null, error: { code: 'BAD_REQUEST', message: `You are already on the ${tier} plan` } },
        400,
      );
    }

    const priceAmountCents = tier === 'pro' ? 1900 : 4900;
    const frontendUrl = env.FRONTEND_URL || 'https://sotally.com';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Sotally ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
              description: `Monthly ${tier} platform subscription`,
            },
            unit_amount: priceAmountCents,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'platform_subscription',
        userId: user.id,
        tier,
      },
      success_url: `${frontendUrl}/dashboard?subscription=success&tier=${tier}`,
      cancel_url: `${frontendUrl}/pricing?subscription=cancelled`,
    };

    // Attach existing Stripe customer if available
    if (currentUser?.stripeCustomerId) {
      sessionParams.customer = currentUser.stripeCustomerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return c.json({
      success: true,
      data: { url: session.url },
      error: null,
    });
  },
);

// ─── GET /billing/purchases — List user's purchased apps ─────────────────────

billingRoutes.get('/purchases', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;

  const purchases = await db
    .select({
      id: toolLicenses.id,
      appId: toolLicenses.toolId,
      purchasedAt: toolLicenses.purchasedAt,
      creditsPaid: toolLicenses.creditsPaid,
      appName: apps.name,
      appSlug: apps.slug,
      appIconUrl: apps.iconUrl,
      appStatus: apps.status,
    })
    .from(toolLicenses)
    .innerJoin(apps, eq(toolLicenses.toolId, apps.id))
    .where(eq(toolLicenses.userId, user.id))
    .orderBy(desc(toolLicenses.purchasedAt));

  return c.json({ success: true, data: purchases, error: null });
});

// ─── POST /billing/connect/onboard — Start Stripe Connect onboarding ─────────

billingRoutes.post('/connect/onboard', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;

  // Check if user already has a connect account
  const [currentUser] = await db
    .select({ stripeConnectId: users.stripeConnectId })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  let accountId = currentUser?.stripeConnectId;

  if (!accountId) {
    // Create new Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      metadata: { userId: user.id },
    });
    accountId = account.id;

    // Store on user record
    await db
      .update(users)
      .set({ stripeConnectId: accountId, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  const frontendUrl = env.FRONTEND_URL || 'https://sotally.com';

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${frontendUrl}/dashboard/revenue?connect=refresh`,
    return_url: `${frontendUrl}/dashboard/revenue?connect=complete`,
    type: 'account_onboarding',
  });

  return c.json({
    success: true,
    data: { url: accountLink.url },
    error: null,
  });
});

// ─── GET /billing/connect/status — Check Connect onboarding status ───────────

billingRoutes.get('/connect/status', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;

  const [currentUser] = await db
    .select({ stripeConnectId: users.stripeConnectId })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!currentUser?.stripeConnectId) {
    return c.json({
      success: true,
      data: { connected: false, chargesEnabled: false, payoutsEnabled: false },
      error: null,
    });
  }

  const account = await stripe.accounts.retrieve(currentUser.stripeConnectId);

  return c.json({
    success: true,
    data: {
      connected: true,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
    },
    error: null,
  });
});

export default billingRoutes;
