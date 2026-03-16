import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, creditTransactions } from '../db/schema/index.js';

export async function holdCredits(
  userId: string,
  amount: number,
  referenceId: string,
  referenceType: string,
): Promise<{ success: boolean; balanceAfter: number }> {
  // Atomic deduct: only succeeds if balance is sufficient
  const result = await db
    .update(users)
    .set({
      creditBalance: sql`${users.creditBalance} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), sql`${users.creditBalance} >= ${amount}`))
    .returning({ creditBalance: users.creditBalance });

  if (result.length === 0) {
    return { success: false, balanceAfter: -1 };
  }

  const balanceAfter = result[0].creditBalance;

  await db.insert(creditTransactions).values({
    userId,
    type: 'debit_execution',
    amount: -amount,
    balanceAfter,
    referenceId,
    referenceType,
    description: `Credit hold for ${referenceType}`,
  });

  return { success: true, balanceAfter };
}

export async function commitCredits(
  executionId: string,
  creatorId: string,
  platformShare: number,
  creatorShare: number,
): Promise<void> {
  // Credit creator's earnings balance
  const result = await db
    .update(users)
    .set({
      earningsBalance: sql`${users.earningsBalance} + ${creatorShare}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, creatorId))
    .returning({ earningsBalance: users.earningsBalance });

  if (result.length > 0) {
    await db.insert(creditTransactions).values({
      userId: creatorId,
      type: 'purchase', // creator earning
      amount: creatorShare,
      balanceAfter: result[0].earningsBalance,
      referenceId: executionId,
      referenceType: 'execution',
      description: `Creator earnings from execution`,
    });
  }
}

export async function refundCredits(
  userId: string,
  amount: number,
  executionId: string,
): Promise<void> {
  const result = await db
    .update(users)
    .set({
      creditBalance: sql`${users.creditBalance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ creditBalance: users.creditBalance });

  if (result.length > 0) {
    await db.insert(creditTransactions).values({
      userId,
      type: 'refund',
      amount,
      balanceAfter: result[0].creditBalance,
      referenceId: executionId,
      referenceType: 'execution',
      description: `Refund for failed execution`,
    });
  }
}

export async function grantCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'signup_bonus' | 'referral_bonus' | 'admin_grant',
  description: string,
  referenceId?: string,
  referenceType?: string,
): Promise<{ balanceAfter: number }> {
  const result = await db
    .update(users)
    .set({
      creditBalance: sql`${users.creditBalance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ creditBalance: users.creditBalance });

  const balanceAfter = result[0].creditBalance;

  await db.insert(creditTransactions).values({
    userId,
    type,
    amount,
    balanceAfter,
    referenceId: referenceId ?? null,
    referenceType: referenceType ?? null,
    description,
  });

  return { balanceAfter };
}

export async function getBalance(userId: string): Promise<{ creditBalance: number; earningsBalance: number }> {
  const result = await db
    .select({
      creditBalance: users.creditBalance,
      earningsBalance: users.earningsBalance,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    throw new Error('User not found');
  }

  return result[0];
}

export async function getTransactions(
  userId: string,
  page: number,
  perPage: number,
  type?: string,
) {
  const offset = (page - 1) * perPage;

  const conditions = [eq(creditTransactions.userId, userId)];
  if (type) {
    conditions.push(eq(creditTransactions.type, type as any));
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(creditTransactions)
      .where(where)
      .orderBy(desc(creditTransactions.createdAt))
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(creditTransactions)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    items,
    total,
    page,
    pageSize: perPage,
    totalPages: Math.ceil(total / perPage),
  };
}
