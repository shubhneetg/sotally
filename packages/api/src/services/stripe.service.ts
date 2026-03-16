import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { env } from '../lib/env';
import { db } from '../db/client';
import { creditPurchases } from '../db/schema/index';
import { CREDIT_PACKAGES } from '@sotally/shared';
import { grantCredits } from './credit.service';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function createCheckoutSession(
  userId: string,
  packageId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ url: string; purchaseId: string }> {
  const pkg = CREDIT_PACKAGES.find((p: { id: string }) => p.id === packageId);
  if (!pkg) {
    throw new Error('Invalid package ID');
  }

  // Create pending purchase record
  const [purchase] = await db
    .insert(creditPurchases)
    .values({
      userId,
      package: pkg.id,
      amountUsd: (pkg.priceCents / 100).toFixed(2),
      creditsGranted: pkg.credits,
      paymentProvider: 'stripe',
      status: 'pending',
    })
    .returning();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${pkg.name} — ${pkg.credits} Credits`,
            description: `Sotally credit package: ${pkg.credits} credits`,
          },
          unit_amount: pkg.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      purchaseId: purchase.id,
      userId,
      packageId: pkg.id,
      credits: String(pkg.credits),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  // Store Stripe session ID on purchase record
  await db
    .update(creditPurchases)
    .set({ paymentId: session.id })
    .where(eq(creditPurchases.id, purchase.id));

  return { url: session.url!, purchaseId: purchase.id };
}

export async function handleWebhook(
  payload: string | Buffer,
  signature: string,
): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { purchaseId, userId, credits } = session.metadata || {};

      if (!purchaseId || !userId || !credits) {
        console.error('[Stripe] Missing metadata on checkout session:', session.id);
        return;
      }

      // Mark purchase completed
      await db
        .update(creditPurchases)
        .set({
          status: 'completed',
          paymentId: session.payment_intent as string,
        })
        .where(eq(creditPurchases.id, purchaseId));

      // Grant credits to user
      await grantCredits(
        userId,
        parseInt(credits, 10),
        'purchase',
        `Purchased ${credits} credits`,
        purchaseId,
        'purchase',
      );

      console.log(`[Stripe] Granted ${credits} credits to user ${userId}`);
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }
}
