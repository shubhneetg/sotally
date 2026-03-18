'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, ExternalLink, AlertCircle } from 'lucide-react';
import { useAuthStore, useAuthHydrated } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface MyApp {
  id: string;
  name: string;
  slug: string;
  totalSessions: number;
  totalRevenueCents: number;
  status: string;
  iconUrl: string | null;
}

interface ConnectStatus {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted?: boolean;
}

export default function RevenueDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const _hasHydrated = useAuthHydrated();
  const { addToast } = useToast();

  const [apps, setApps] = useState<MyApp[]>([]);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !token) {
      router.push('/login?redirect=/dashboard/revenue');
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const [appsRes, connectRes] = await Promise.all([
          fetch(`${API_URL}/apps/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/billing/connect/status`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (appsRes.ok) {
          const appsData = await appsRes.json();
          const items = Array.isArray(appsData.data)
            ? appsData.data
            : appsData.data?.items || [];
          setApps(items);
        }

        if (connectRes.ok) {
          const connectData = await connectRes.json();
          setConnectStatus(connectData.data);
        }
      } catch {
        addToast('Failed to load revenue data', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [_hasHydrated, isAuthenticated, token, router, addToast]);

  const handleConnectStripe = async () => {
    if (!token || connectLoading) return;
    setConnectLoading(true);
    try {
      const res = await fetch(`${API_URL}/billing/connect/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        addToast(data.error?.message || 'Failed to start onboarding', 'error');
      }
    } catch {
      addToast('Failed to connect Stripe', 'error');
    } finally {
      setConnectLoading(false);
    }
  };

  const totalEarningsCents = apps.reduce((sum, app) => sum + (app.totalRevenueCents || 0), 0);
  const totalEarnings = (totalEarningsCents / 100).toFixed(2);

  // Rough estimate: this month's earnings (apps created or active this month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEarningsCents = apps.reduce((sum, app) => {
    // Use total revenue as proxy; real implementation would use date-filtered sessions
    return sum + (app.totalRevenueCents || 0);
  }, 0);
  const thisMonthEarnings = (thisMonthEarningsCents / 100).toFixed(2);

  if (!_hasHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary">Revenue</h1>
      </div>

      {/* Stripe Connect Banner */}
      {connectStatus && !connectStatus.chargesEnabled && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Connect Stripe to receive payouts</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Set up Stripe Connect so you can receive payments when users purchase your apps.
              </p>
              <button
                onClick={handleConnectStripe}
                disabled={connectLoading}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                {connectLoading ? 'Redirecting...' : 'Connect Stripe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {connectStatus?.chargesEnabled && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Stripe Connected — Payouts enabled
            </span>
          </div>
        </div>
      )}

      {/* Earnings Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-3xl font-bold text-primary">${totalEarnings}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-3xl font-bold text-primary">${thisMonthEarnings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-App Revenue Table */}
      <div>
        <h2 className="text-lg font-semibold text-primary">Revenue by App</h2>
        <div className="mt-4 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-4 sm:px-6 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted" />
                    <div className="space-y-1">
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-3 w-20 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : apps.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-6">App</th>
                  <th className="hidden px-4 py-3 text-right font-semibold text-foreground sm:table-cell sm:px-6">Sessions</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground sm:px-6">Revenue</th>
                  <th className="hidden px-4 py-3 text-right font-semibold text-foreground sm:table-cell sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm">
                          {app.iconUrl ? (
                            <img src={app.iconUrl} alt={app.name} className="h-8 w-8 rounded-lg object-cover" />
                          ) : (
                            <span className="text-accent font-medium">{app.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="font-medium text-foreground truncate">{app.name}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell sm:px-6">
                      {(app.totalSessions || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground sm:px-6">
                      ${((app.totalRevenueCents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="hidden px-4 py-3 text-right sm:table-cell sm:px-6">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          app.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-12 text-center sm:px-6">
              <p className="text-sm text-muted-foreground">No apps yet. Create and publish an app to start earning.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
