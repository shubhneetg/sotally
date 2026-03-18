'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Calendar, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useCreditStore } from '@/stores/credit.store';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface MyApp {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'published' | 'building' | 'failed';
  viewCount: number;
  createdAt: string;
  iconUrl: string | null;
  description: string;
}

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

  const [myApps, setMyApps] = useState<MyApp[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
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

    async function fetchMyApps() {
      setAppsLoading(true);
      try {
        const res = await fetch(`${API_URL}/apps/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data.data)
            ? data.data
            : data.data?.items || [];
          setMyApps(items);
        }
      } catch {
        // Non-critical
      } finally {
        setAppsLoading(false);
      }
    }

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

    fetchMyApps();
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

  const statusBadge = (status: MyApp['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Published</Badge>;
      case 'draft':
        return <Badge variant="muted">Draft</Badge>;
      case 'building':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">Building</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary">
          {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create New App
        </Link>
      </div>

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

      {/* My Apps */}
      <div>
        <h2 className="text-lg font-semibold text-primary">My Apps</h2>
        {appsLoading ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : myApps.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myApps.map((app) => (
              <Link
                key={app.id}
                href={`/studio/${app.id}`}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-lg">
                      {app.iconUrl ? (
                        <img
                          src={app.iconUrl}
                          alt={app.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <Sparkles className="h-5 w-5 text-accent" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
                        {app.name}
                      </h3>
                      {app.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {app.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {statusBadge(app.status)}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {(app.viewCount || 0).toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(app.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
            {/* Create card */}
            <Link
              href="/create"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center transition-all hover:border-accent/50 hover:bg-card"
            >
              <Plus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Create new app</span>
            </Link>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-primary">Create your first app</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Describe what you want in plain English and get a working app in minutes.
            </p>
            <Link
              href="/create"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Create Your First App
            </Link>
          </div>
        )}
      </div>

      {/* Referral Card */}
      {user?.referralCode && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900 p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Invite friends, earn credits</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Share your link — you both get 50 credits when they sign up.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="rounded-md bg-background border border-border px-3 py-1.5 text-xs text-foreground font-mono">
                  sotally.com/?ref={user.referralCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://sotally.com/?ref=${user.referralCode}`);
                    addToast('Referral link copied!', 'success');
                  }}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Balance Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your Credit Balance</p>
            <p className="mt-1 text-4xl font-bold text-primary">{balance}</p>
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
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      execution.status === 'completed' ? 'bg-emerald-500' :
                      execution.status === 'failed' ? 'bg-destructive' :
                      'bg-yellow-500'
                    )} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {execution.toolName || execution.toolSlug}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(execution.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {execution.creditsCost} credits
                    </span>
                    {execution.toolSlug && (
                      <Link
                        href={`/tools/${execution.toolSlug}/run`}
                        className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                      >
                        Run again
                      </Link>
                    )}
                  </div>
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
