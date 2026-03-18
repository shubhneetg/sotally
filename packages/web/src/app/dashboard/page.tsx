'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Calendar, Sparkles, Users, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
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

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, token, user, _hasHydrated } = useAuthStore();
  const { addToast } = useToast();

  const [myApps, setMyApps] = useState<MyApp[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !token) {
      router.push('/login?redirect=/dashboard');
      return;
    }

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

    fetchMyApps();
  }, [_hasHydrated, isAuthenticated, token, router]);

  if (!_hasHydrated || !isAuthenticated) {
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

  const totalViews = myApps.reduce((sum, app) => sum + (app.viewCount || 0), 0);
  const publishedCount = myApps.filter((a) => a.status === 'published').length;

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

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <LayoutGrid className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{myApps.length}</p>
              <p className="text-xs text-muted-foreground">Total Apps</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Eye className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{publishedCount}</p>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
          </div>
        </div>
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
    </div>
  );
}
