'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface DashboardData {
  affiliateCode: string;
  tier: string;
  commissionRate: string;
  totalReferrals: number;
  totalEarnings: string;
  earningsThisMonth: string;
  trackingUrl: string;
  status: string;
  createdAt: string;
}

interface Referral {
  id: string;
  userName: string;
  signupDate: string;
  totalSpent: string;
  commissionEarned: string;
}

interface EarningTransaction {
  id: string;
  type: string;
  amount: string;
  balanceAfter: string;
  description: string | null;
  createdAt: string;
}

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const MINIMUM_PAYOUT = 25;

export default function AffiliateDashboardPage() {
  const { token, isAuthenticated } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [referrals, setReferrals] = useState<PaginatedData<Referral> | null>(null);
  const [earnings, setEarnings] = useState<PaginatedData<EarningTransaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAffiliate, setNotAffiliate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralPage, setReferralPage] = useState(1);
  const [earningsPage, setEarningsPage] = useState(1);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const [dashRes, refRes, earnRes] = await Promise.all([
          api.affiliates.dashboard(token!) as Promise<{ success: boolean; data: DashboardData }>,
          api.affiliates.referrals(token!, referralPage) as Promise<{
            success: boolean;
            data: PaginatedData<Referral>;
          }>,
          api.affiliates.earnings(token!, earningsPage) as Promise<{
            success: boolean;
            data: PaginatedData<EarningTransaction> & { balance: string };
          }>,
        ]);

        if (dashRes.success) setDashboard(dashRes.data);
        if (refRes.success) setReferrals(refRes.data);
        if (earnRes.success) setEarnings(earnRes.data);
      } catch (err: any) {
        if (err.message?.includes('not an affiliate') || err.message?.includes('Not an affiliate')) {
          setNotAffiliate(true);
        }
        console.error('Failed to load affiliate dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, referralPage, earningsPage]);

  async function copyTrackingLink() {
    if (!dashboard) return;
    await navigator.clipboard.writeText(dashboard.trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePayout() {
    if (!token) return;
    setPayoutLoading(true);
    setPayoutMessage(null);
    try {
      const res = (await api.affiliates.requestPayout(token)) as {
        success: boolean;
        data: { message: string };
      };
      if (res.success) {
        setPayoutMessage(res.data.message);
        // Refresh dashboard
        const dashRes = (await api.affiliates.dashboard(token)) as {
          success: boolean;
          data: DashboardData;
        };
        if (dashRes.success) setDashboard(dashRes.data);
      }
    } catch (err) {
      setPayoutMessage(err instanceof Error ? err.message : 'Payout request failed');
    } finally {
      setPayoutLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-primary">Affiliate Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Please log in to access your affiliate dashboard.</p>
        <Link href="/login">
          <Button variant="accent" className="mt-6">Log In</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded-lg bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (notAffiliate) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-primary">Affiliate Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          You are not yet an affiliate. Apply to join our program and start earning.
        </p>
        <Link href="/affiliate/apply">
          <Button variant="accent" className="mt-6">Apply Now</Button>
        </Link>
      </div>
    );
  }

  if (!dashboard) return null;

  const balance = parseFloat(dashboard.totalEarnings);
  const canPayout = balance >= MINIMUM_PAYOUT;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">
            Track your referrals and earnings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{dashboard.tier}</Badge>
          <Badge variant="muted">{(parseFloat(dashboard.commissionRate) * 100).toFixed(0)}% commission</Badge>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{dashboard.totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{referrals?.total ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Earnings This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              ${parseFloat(dashboard.earningsThisMonth).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              ${parseFloat(dashboard.totalEarnings).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracking link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tracking Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-border bg-muted/50 px-4 py-3 font-mono text-sm text-foreground">
              {dashboard.trackingUrl}
            </div>
            <Button variant="accent" onClick={copyTrackingLink}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Affiliate code: <span className="font-mono font-medium">{dashboard.affiliateCode}</span>
          </p>
        </CardContent>
      </Card>

      {/* Payout section */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <div className="mt-1 text-3xl font-bold text-primary">${balance.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <Button
              variant="accent"
              disabled={!canPayout || payoutLoading}
              onClick={handlePayout}
            >
              {payoutLoading ? 'Processing...' : 'Request Payout'}
            </Button>
            {!canPayout && (
              <p className="mt-2 text-xs text-muted-foreground">
                Min ${MINIMUM_PAYOUT} to request payout
              </p>
            )}
            {payoutMessage && (
              <p className="mt-2 text-xs text-accent">{payoutMessage}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referrals table */}
      <Card>
        <CardHeader>
          <CardTitle>Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals?.items && referrals.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">User</th>
                    <th className="pb-3 font-medium text-muted-foreground">Signup Date</th>
                    <th className="pb-3 font-medium text-muted-foreground">Total Spent</th>
                    <th className="pb-3 font-medium text-muted-foreground">Commission Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {referrals.items.map((ref) => (
                    <tr key={ref.id}>
                      <td className="py-3 font-medium text-foreground">{ref.userName}</td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(ref.signupDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        ${parseFloat(ref.totalSpent).toFixed(2)}
                      </td>
                      <td className="py-3 text-accent">
                        ${parseFloat(ref.commissionEarned).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No referrals yet. Share your tracking link to start earning.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral pagination */}
      {referrals && referrals.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={referralPage <= 1}
            onClick={() => setReferralPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {referralPage} of {referrals.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={referralPage >= referrals.totalPages}
            onClick={() => setReferralPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Earnings history */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings?.items && earnings.items.length > 0 ? (
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
                  {earnings.items.map((tx) => {
                    const amount = parseFloat(tx.amount);
                    return (
                      <tr key={tx.id}>
                        <td className="py-3 text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={
                              tx.type === 'commission'
                                ? 'default'
                                : tx.type === 'payout'
                                ? 'accent'
                                : 'muted'
                            }
                          >
                            {tx.type}
                          </Badge>
                        </td>
                        <td
                          className={`py-3 font-medium ${
                            amount >= 0 ? 'text-accent' : 'text-destructive'
                          }`}
                        >
                          {amount >= 0 ? '+' : ''}${Math.abs(amount).toFixed(2)}
                        </td>
                        <td className="py-3 text-muted-foreground">{tx.description || '--'}</td>
                        <td className="py-3 text-foreground">${parseFloat(tx.balanceAfter).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No earnings history yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings pagination */}
      {earnings && earnings.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={earningsPage <= 1}
            onClick={() => setEarningsPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {earningsPage} of {earnings.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={earningsPage >= earnings.totalPages}
            onClick={() => setEarningsPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
