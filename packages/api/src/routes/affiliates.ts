import { Hono } from 'hono';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db } from '../db/client';
import {
  affiliates,
  affiliateReferrals,
  affiliateTransactions,
  users,
  creditPurchases,
} from '../db/schema/index';
import { authMiddleware, type AuthUser } from '../middleware/auth';

const affiliateRoutes = new Hono();

// All affiliate routes require auth
affiliateRoutes.use('*', authMiddleware);

function generateAffiliateCode(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8);
  const suffix = randomBytes(3).toString('hex');
  return `${slug}-${suffix}`;
}

// ─── POST /affiliates/apply — Apply to become an affiliate ──────────────────

affiliateRoutes.post('/apply', async (c) => {
  const user = c.get('user') as AuthUser;

  // Check if already an affiliate
  const [existing] = await db
    .select({ id: affiliates.id })
    .from(affiliates)
    .where(eq(affiliates.userId, user.id))
    .limit(1);

  if (existing) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'ALREADY_AFFILIATE', message: 'You are already an affiliate' },
      },
      409,
    );
  }

  // Fetch user name for code generation
  const [userData] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const affiliateCode = generateAffiliateCode(userData?.name || 'affiliate');

  const [affiliate] = await db
    .insert(affiliates)
    .values({
      userId: user.id,
      affiliateCode,
      commissionRate: '0.10',
      tier: 'starter',
      cookieDurationDays: 30,
      totalReferrals: 0,
      totalEarnings: '0',
      status: 'active',
    })
    .returning();

  const trackingUrl = `https://sotally.com/?ref=${affiliate.affiliateCode}`;

  return c.json(
    {
      success: true,
      data: {
        affiliateCode: affiliate.affiliateCode,
        trackingUrl,
        commissionRate: affiliate.commissionRate,
        tier: affiliate.tier,
      },
      error: null,
    },
    201,
  );
});

// ─── GET /affiliates/dashboard — Affiliate dashboard ────────────────────────

affiliateRoutes.get('/dashboard', async (c) => {
  const user = c.get('user') as AuthUser;

  const [affiliate] = await db
    .select()
    .from(affiliates)
    .where(eq(affiliates.userId, user.id))
    .limit(1);

  if (!affiliate) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'NOT_AFFILIATE', message: 'You are not an affiliate. Apply first.' },
      },
      403,
    );
  }

  // Calculate earnings this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [monthlyEarnings] = await db
    .select({
      total: sql<string>`coalesce(sum(${affiliateTransactions.amount}), '0')`,
    })
    .from(affiliateTransactions)
    .where(
      and(
        eq(affiliateTransactions.affiliateId, affiliate.id),
        eq(affiliateTransactions.type, 'commission'),
        gte(affiliateTransactions.createdAt, startOfMonth),
      ),
    );

  const trackingUrl = `https://sotally.com/?ref=${affiliate.affiliateCode}`;

  return c.json({
    success: true,
    data: {
      affiliateCode: affiliate.affiliateCode,
      tier: affiliate.tier,
      commissionRate: affiliate.commissionRate,
      totalReferrals: affiliate.totalReferrals,
      totalEarnings: affiliate.totalEarnings,
      earningsThisMonth: monthlyEarnings?.total ?? '0',
      trackingUrl,
      status: affiliate.status,
      createdAt: affiliate.createdAt,
    },
    error: null,
  });
});

// ─── GET /affiliates/referrals — List referred users ────────────────────────

affiliateRoutes.get('/referrals', async (c) => {
  const user = c.get('user') as AuthUser;
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;

  const [affiliate] = await db
    .select({ id: affiliates.id })
    .from(affiliates)
    .where(eq(affiliates.userId, user.id))
    .limit(1);

  if (!affiliate) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'NOT_AFFILIATE', message: 'You are not an affiliate' },
      },
      403,
    );
  }

  const where = eq(affiliateReferrals.affiliateId, affiliate.id);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: affiliateReferrals.id,
        referredUserId: affiliateReferrals.referredUserId,
        createdAt: affiliateReferrals.createdAt,
        userName: users.name,
      })
      .from(affiliateReferrals)
      .innerJoin(users, eq(users.id, affiliateReferrals.referredUserId))
      .where(where)
      .orderBy(desc(affiliateReferrals.createdAt))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(affiliateReferrals)
      .where(where),
  ]);

  // Calculate commission earned per referral
  const referralIds = items.map((r) => r.referredUserId);
  const commissionsMap = new Map<string, string>();

  if (referralIds.length > 0) {
    // Sum commissions grouped by the purchase user (via referenceId on transaction)
    const commissions = await db
      .select({
        referredUserId: affiliateReferrals.referredUserId,
        totalCommission: sql<string>`coalesce(sum(${affiliateTransactions.amount}), '0')`,
      })
      .from(affiliateTransactions)
      .innerJoin(
        affiliateReferrals,
        and(
          eq(affiliateReferrals.affiliateId, affiliate.id),
          eq(affiliateTransactions.affiliateId, affiliate.id),
          eq(affiliateTransactions.type, 'commission'),
        ),
      )
      .where(eq(affiliateTransactions.affiliateId, affiliate.id))
      .groupBy(affiliateReferrals.referredUserId);

    for (const c of commissions) {
      commissionsMap.set(c.referredUserId, c.totalCommission);
    }
  }

  // Calculate total credits spent per referred user
  const spentMap = new Map<string, string>();
  if (referralIds.length > 0) {
    for (const refId of referralIds) {
      const [spent] = await db
        .select({
          total: sql<string>`coalesce(sum(${creditPurchases.amountUsd}), '0')`,
        })
        .from(creditPurchases)
        .where(
          and(
            eq(creditPurchases.userId, refId),
            eq(creditPurchases.status, 'completed'),
          ),
        );
      spentMap.set(refId, spent?.total ?? '0');
    }
  }

  const total = countResult[0]?.count ?? 0;

  // Mask user names: "John Doe" -> "J*** D***"
  const maskedItems = items.map((item) => {
    const parts = (item.userName || 'User').split(' ');
    const masked = parts
      .map((p) => (p.length > 0 ? `${p[0]}${'*'.repeat(Math.max(2, p.length - 1))}` : ''))
      .join(' ');
    return {
      id: item.id,
      userName: masked,
      signupDate: item.createdAt,
      totalSpent: spentMap.get(item.referredUserId) ?? '0',
      commissionEarned: commissionsMap.get(item.referredUserId) ?? '0',
    };
  });

  return c.json({
    success: true,
    data: {
      items: maskedItems,
      total,
      page,
      pageSize: perPage,
      totalPages: Math.ceil(total / perPage),
    },
    error: null,
  });
});

// ─── GET /affiliates/earnings — Earnings transaction history ────────────────

affiliateRoutes.get('/earnings', async (c) => {
  const user = c.get('user') as AuthUser;
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;

  const [affiliate] = await db
    .select({ id: affiliates.id, totalEarnings: affiliates.totalEarnings })
    .from(affiliates)
    .where(eq(affiliates.userId, user.id))
    .limit(1);

  if (!affiliate) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'NOT_AFFILIATE', message: 'You are not an affiliate' },
      },
      403,
    );
  }

  const where = eq(affiliateTransactions.affiliateId, affiliate.id);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: affiliateTransactions.id,
        type: affiliateTransactions.type,
        amount: affiliateTransactions.amount,
        balanceAfter: affiliateTransactions.balanceAfter,
        description: affiliateTransactions.description,
        referenceId: affiliateTransactions.referenceId,
        referenceType: affiliateTransactions.referenceType,
        createdAt: affiliateTransactions.createdAt,
      })
      .from(affiliateTransactions)
      .where(where)
      .orderBy(desc(affiliateTransactions.createdAt))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(affiliateTransactions)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return c.json({
    success: true,
    data: {
      balance: affiliate.totalEarnings,
      items,
      total,
      page,
      pageSize: perPage,
      totalPages: Math.ceil(total / perPage),
    },
    error: null,
  });
});

// ─── POST /affiliates/payouts — Request payout ─────────────────────────────

affiliateRoutes.post('/payouts', async (c) => {
  const user = c.get('user') as AuthUser;

  const [affiliate] = await db
    .select()
    .from(affiliates)
    .where(eq(affiliates.userId, user.id))
    .limit(1);

  if (!affiliate) {
    return c.json(
      {
        success: false,
        data: null,
        error: { code: 'NOT_AFFILIATE', message: 'You are not an affiliate' },
      },
      403,
    );
  }

  const balance = parseFloat(affiliate.totalEarnings);
  const MINIMUM_PAYOUT = 25.0;

  if (balance < MINIMUM_PAYOUT) {
    return c.json(
      {
        success: false,
        data: null,
        error: {
          code: 'BELOW_MINIMUM',
          message: `Minimum payout is $${MINIMUM_PAYOUT.toFixed(2)}. Your balance is $${balance.toFixed(2)}.`,
        },
      },
      400,
    );
  }

  // Create payout transaction and zero out balance
  const [transaction] = await db.transaction(async (tx) => {
    const newBalance = '0.00';

    const [txn] = await tx
      .insert(affiliateTransactions)
      .values({
        affiliateId: affiliate.id,
        type: 'payout',
        amount: (-balance).toFixed(2),
        balanceAfter: newBalance,
        description: `Payout request: $${balance.toFixed(2)}`,
      })
      .returning();

    await tx
      .update(affiliates)
      .set({ totalEarnings: newBalance })
      .where(eq(affiliates.id, affiliate.id));

    return [txn];
  });

  return c.json({
    success: true,
    data: {
      transactionId: transaction.id,
      amount: balance.toFixed(2),
      message: 'Payout request submitted. You will receive payment within 5-7 business days.',
    },
    error: null,
  });
});

export default affiliateRoutes;
