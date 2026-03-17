'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useCreditStore } from '@/stores/credit.store';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface Execution {
  id: string;
  toolName: string;
  toolSlug: string;
  creditsCost: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuthStore();
  const { balance, fetchBalance } = useCreditStore();
  const { addToast } = useToast();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    fetchBalance(token);

    async function fetchExecutions() {
      setLoading(true);
      setError(null);
      try {
        const res = (await api.executions.list(token!)) as {
          success: boolean;
          data: { items: Execution[] } | Execution[];
        };
        const items = Array.isArray(res.data) ? res.data : (res.data as { items: Execution[] }).items || [];
        setExecutions(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load executions');
      } finally {
        setLoading(false);
      }
    }

    fetchExecutions();
  }, [isAuthenticated, token, router, fetchBalance]);

  const handleClaimDaily = async () => {
    if (!token || claimLoading) return;
    setClaimLoading(true);
    try {
      await api.credits.claimDaily(token);
      addToast('You claimed 5 free credits!', 'success');
      setDailyClaimed(true);
      fetchBalance(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to claim credits';
      if (message.toLowerCase().includes('already')) {
        setDailyClaimed(true);
        addToast('You already claimed today. Come back tomorrow!', 'info');
      } else {
        addToast(message, 'error');
      }
    } finally {
      setClaimLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-primary">
        {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Dashboard'}
      </h1>

      {/* Daily Credits Banner */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {dailyClaimed ? 'Daily credits claimed!' : 'Claim your daily 5 free credits!'}
          </p>
          <p className="text-xs text-muted-foreground">
            {dailyClaimed
              ? 'Come back tomorrow for more free credits.'
              : 'Log in every day to earn free credits.'}
          </p>
        </div>
        <button
          onClick={handleClaimDaily}
          disabled={dailyClaimed || claimLoading}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            dailyClaimed
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-accent text-accent-foreground hover:bg-accent/90'
          }`}
        >
          {claimLoading ? 'Claiming...' : dailyClaimed ? 'Come back tomorrow!' : 'Claim Credits'}
        </button>
      </div>

      {/* Credit Balance Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your Credit Balance</p>
            <p className="mt-1 text-4xl font-bold text-primary">🪙 {balance}</p>
          </div>
          <Link
            href="/dashboard/credits"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Buy Credits
          </Link>
        </div>
      </div>

      {/* Recent Executions */}
      <div>
        <h2 className="text-lg font-semibold text-primary">Recent Executions</h2>
        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="mt-4 rounded-xl border border-border bg-card shadow-sm">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 sm:px-6 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-muted" />
                    <div className="space-y-1">
                      <div className="h-4 w-40 rounded bg-muted" />
                      <div className="h-3 w-20 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-4 w-12 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : executions.length > 0 ? (
            <div className="divide-y divide-border">
              {executions.slice(0, 10).map((execution) => (
                <div key={execution.id} className="flex items-center justify-between px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      execution.status === 'completed' ? 'bg-emerald-500' :
                      execution.status === 'failed' ? 'bg-destructive' :
                      'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {execution.toolName || execution.toolSlug}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(execution.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    🪙 {execution.creditsCost}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center sm:px-6">
              <p className="text-sm text-muted-foreground">No executions yet.</p>
              <Link href="/tools" className="mt-2 inline-block text-sm font-medium text-accent hover:text-accent/80">
                Browse tools to get started
              </Link>
            </div>
          )}
          {executions.length > 0 && (
            <div className="border-t border-border px-4 py-3 text-center sm:px-6">
              <Link
                href="/dashboard/tools"
                className="text-sm font-medium text-accent hover:text-accent/80"
              >
                View all executions
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
