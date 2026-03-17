'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useCreditStore } from '@/stores/credit.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const creditPackages = [
  {
    id: 'starter',
    name: 'Starter',
    price: 10,
    credits: 100,
    bonus: 0,
    popular: false,
  },
  {
    id: 'popular',
    name: 'Popular',
    price: 25,
    credits: 275,
    bonus: 10,
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 50,
    credits: 600,
    bonus: 20,
    popular: false,
  },
  {
    id: 'business',
    name: 'Business',
    price: 100,
    credits: 1300,
    bonus: 30,
    popular: false,
  },
];

export default function CreditsPage() {
  const { token } = useAuthStore();
  const { balance, transactions, currentPage, totalPages, loading, fetchBalance, fetchTransactions } =
    useCreditStore();

  useEffect(() => {
    if (token) {
      fetchBalance(token);
      fetchTransactions(token);
    }
  }, [token, fetchBalance, fetchTransactions]);

  const handlePurchase = (packageId: string) => {
    // TODO: integrate with api.credits.purchase
    console.log('Purchase package:', packageId);
  };

  const handlePageChange = (page: number) => {
    if (token) {
      fetchTransactions(token, page);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-primary">Credits</h1>

      {/* Balance */}
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Current Balance</p>
        <p className="mt-2 text-5xl font-bold text-primary">🪙 {balance.toLocaleString()}</p>
      </div>

      {/* Packages */}
      <div>
        <h2 className="text-lg font-semibold text-primary">Buy Credits</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creditPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative flex flex-col ${pkg.popular ? 'border-accent ring-2 ring-accent/20' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="accent">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <p className="mt-1 text-3xl font-bold text-primary">${pkg.price}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">🪙 {pkg.credits}</p>
                  <p className="text-xs text-muted-foreground">credits</p>
                  {pkg.bonus > 0 && (
                    <p className="mt-1 text-xs font-medium text-emerald-600">+{pkg.bonus}% bonus</p>
                  )}
                </div>
                <Button
                  variant={pkg.popular ? 'accent' : 'outline'}
                  className="mt-auto w-full"
                  onClick={() => handlePurchase(pkg.id)}
                >
                  Buy
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-semibold text-primary">Transaction History</h2>
        <div className="mt-4 rounded-xl border border-border bg-card shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No transactions yet. Buy some credits to get started.
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
                <span>Date</span>
                <span>Type</span>
                <span>Amount</span>
                <span>Description</span>
                <span className="text-right">Balance After</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-col gap-1 px-4 py-3 sm:grid sm:grid-cols-5 sm:items-center sm:gap-4 sm:px-6"
                  >
                    <span className="text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      <Badge
                        variant={
                          tx.type === 'purchase'
                            ? 'accent'
                            : tx.type === 'usage'
                              ? 'muted'
                              : tx.type === 'refund'
                                ? 'outline'
                                : 'default'
                        }
                      >
                        {tx.type}
                      </Badge>
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        tx.amount > 0 ? 'text-emerald-600' : 'text-foreground'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">{tx.description}</span>
                    <span className="text-sm font-medium text-foreground sm:text-right">
                      🪙 {tx.balanceAfter}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
