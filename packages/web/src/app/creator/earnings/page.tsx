'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface EarningTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
}

interface EarningsData {
  balance: number;
  items: EarningTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PAYOUT_MINIMUM_CREDITS = 5000; // ~$50 equivalent

export default function EarningsPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;

    async function load() {
      setLoading(true);
      try {
        const res = (await api.creator.earnings(token!, page)) as {
          success: boolean;
          data: EarningsData;
        };
        if (res.success) setData(res.data);
      } catch (err) {
        console.error('Failed to load earnings:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, page]);

  const balance = data?.balance ?? 0;
  const balanceUsd = (balance * 0.01).toFixed(2);
  const canPayout = balance >= PAYOUT_MINIMUM_CREDITS;

  // Calculate monthly summaries from transactions
  const monthlySummary: Record<string, { earned: number; paid: number }> = {};
  if (data?.items) {
    for (const tx of data.items) {
      const month = new Date(tx.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      if (!monthlySummary[month]) monthlySummary[month] = { earned: 0, paid: 0 };
      if (tx.type === 'earning') monthlySummary[month].earned += tx.amount;
      if (tx.type === 'payout') monthlySummary[month].paid += Math.abs(tx.amount);
    }
  }

  const transactionTypeBadge = (type: string) => {
    switch (type) {
      case 'earning':
        return 'default' as const;
      case 'payout':
        return 'accent' as const;
      case 'refund_deduction':
        return 'destructive' as const;
      default:
        return 'muted' as const;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Earnings</h1>
        <p className="text-muted-foreground">Track your creator earnings and payouts</p>
      </div>

      {/* Balance + payout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="sm:col-span-2">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <div className="mt-1 text-3xl font-bold text-primary">
                {balance.toLocaleString()} credits
              </div>
              <p className="mt-1 text-sm text-muted-foreground">~${balanceUsd} USD</p>
            </div>
            <div>
              <Button
                variant="accent"
                disabled={!canPayout}
                title={
                  canPayout
                    ? 'Request a payout'
                    : `Minimum ${PAYOUT_MINIMUM_CREDITS.toLocaleString()} credits ($50) required`
                }
              >
                Request Payout
              </Button>
              {!canPayout && (
                <p className="mt-2 text-xs text-muted-foreground text-right">
                  Min {PAYOUT_MINIMUM_CREDITS.toLocaleString()} credits
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Payout Threshold</p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{PAYOUT_MINIMUM_CREDITS.toLocaleString()} credits</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{
                    width: `${Math.min(100, (balance / PAYOUT_MINIMUM_CREDITS) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                {Math.min(100, Math.round((balance / PAYOUT_MINIMUM_CREDITS) * 100))}% to payout
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly summary */}
      {Object.keys(monthlySummary).length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(monthlySummary)
            .slice(0, 4)
            .map(([month, summary]) => (
              <Card key={month}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{month}</p>
                  <p className="mt-1 text-lg font-bold text-accent">
                    +{summary.earned.toLocaleString()}
                  </p>
                  {summary.paid > 0 && (
                    <p className="text-xs text-muted-foreground">
                      -{summary.paid.toLocaleString()} paid out
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Transactions history */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.items && data.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 font-medium text-muted-foreground">Type</th>
                    <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                    <th className="pb-3 font-medium text-muted-foreground">Description</th>
                    <th className="pb-3 font-medium text-muted-foreground">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <Badge variant={transactionTypeBadge(tx.type)}>{tx.type}</Badge>
                      </td>
                      <td
                        className={`py-3 font-medium ${
                          tx.amount >= 0 ? 'text-accent' : 'text-destructive'
                        }`}
                      >
                        {tx.amount >= 0 ? '+' : ''}
                        {tx.amount.toLocaleString()} cr
                      </td>
                      <td className="py-3 text-muted-foreground">{tx.description || '--'}</td>
                      <td className="py-3 text-foreground">
                        {tx.balanceAfter.toLocaleString()} cr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No earnings history yet. Start publishing tools to earn credits.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
