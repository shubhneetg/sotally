import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import {
  affiliates,
  affiliateReferrals,
  affiliateTransactions,
} from '../db/schema/index';

/**
 * Track an affiliate referral when a new user registers with a referral code
 * that matches an affiliate's code.
 *
 * This is separate from the user-to-user referral bonus system.
 * Affiliate tracking creates an ongoing commission relationship.
 */
export async function trackAffiliateReferral(
  referralCode: string,
  newUserId: string,
): Promise<{ affiliateId: string } | null> {
  // Look up affiliate by code
  const [affiliate] = await db
    .select({ id: affiliates.id, status: affiliates.status })
    .from(affiliates)
    .where(eq(affiliates.affiliateCode, referralCode))
    .limit(1);

  if (!affiliate || affiliate.status !== 'active') {
    return null;
  }

  // Check if this user is already referred by an affiliate
  const [existing] = await db
    .select({ id: affiliateReferrals.id })
    .from(affiliateReferrals)
    .where(eq(affiliateReferrals.referredUserId, newUserId))
    .limit(1);

  if (existing) {
    return null;
  }

  // Create the affiliate referral record
  await db.insert(affiliateReferrals).values({
    affiliateId: affiliate.id,
    referredUserId: newUserId,
  });

  // Increment the affiliate's total referrals count
  await db
    .update(affiliates)
    .set({
      totalReferrals: sql`${affiliates.totalReferrals} + 1`,
    })
    .where(eq(affiliates.id, affiliate.id));

  return { affiliateId: affiliate.id };
}

/**
 * Process affiliate commission when a referred user makes a credit purchase.
 *
 * Called from the Stripe webhook handler after granting credits.
 * Calculates commission based on the affiliate's commission rate and
 * creates an affiliate_transaction record.
 */
export async function processAffiliateCommission(
  purchasingUserId: string,
  purchaseAmountUsd: string,
  purchaseId: string,
): Promise<void> {
  // Check if the purchasing user was referred by an affiliate
  const [referral] = await db
    .select({
      affiliateId: affiliateReferrals.affiliateId,
    })
    .from(affiliateReferrals)
    .where(eq(affiliateReferrals.referredUserId, purchasingUserId))
    .limit(1);

  if (!referral) {
    return;
  }

  // Get the affiliate's commission rate
  const [affiliate] = await db
    .select({
      id: affiliates.id,
      commissionRate: affiliates.commissionRate,
      totalEarnings: affiliates.totalEarnings,
      status: affiliates.status,
    })
    .from(affiliates)
    .where(eq(affiliates.id, referral.affiliateId))
    .limit(1);

  if (!affiliate || affiliate.status !== 'active') {
    return;
  }

  const amountUsd = parseFloat(purchaseAmountUsd);
  const commissionRate = parseFloat(affiliate.commissionRate);
  const commission = (amountUsd * commissionRate).toFixed(2);
  const newBalance = (parseFloat(affiliate.totalEarnings) + parseFloat(commission)).toFixed(2);

  await db.transaction(async (tx) => {
    // Create commission transaction
    await tx.insert(affiliateTransactions).values({
      affiliateId: affiliate.id,
      type: 'commission',
      amount: commission,
      balanceAfter: newBalance,
      referenceId: purchaseId,
      referenceType: 'credit_purchase',
      description: `Commission on $${amountUsd.toFixed(2)} purchase (${(commissionRate * 100).toFixed(0)}%)`,
    });

    // Update affiliate's total earnings
    await tx
      .update(affiliates)
      .set({ totalEarnings: newBalance })
      .where(eq(affiliates.id, affiliate.id));
  });

  console.log(
    `[Affiliate] Credited $${commission} commission to affiliate ${affiliate.id} for purchase ${purchaseId}`,
  );
}
