'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Users, Calendar, UserPlus, Compass } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useAuthStore } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface FeedApp {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  niche: string | null;
  pricingModel: string;
  totalSessions: number;
  totalUsers: number;
  likeCount: number;
  avgRating: string | null;
  publishedAt: string | null;
  liked: boolean;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
    storefrontSlug: string | null;
  } | null;
}

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  const [apps, setApps] = useState<FeedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchFeed() {
      try {
        if (isAuthenticated && token) {
          // Authenticated: get personalized feed
          const res = await fetch(`${API_URL}/social/feed`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setApps(data.data || []);
            return;
          }
        }

        // Fallback: trending/featured apps
        const res = await fetch(`${API_URL}/apps/featured`);
        if (res.ok) {
          const data = await res.json();
          setApps(
            (data.data || []).map((a: any) => ({ ...a, liked: false })),
          );
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, [isAuthenticated, token]);

  async function toggleLike(appId: string, currentlyLiked: boolean) {
    if (!isAuthenticated || !token) {
      router.push('/login?redirect=/feed');
      return;
    }

    setLikingIds((prev) => new Set(prev).add(appId));

    try {
      const method = currentlyLiked ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/social/like/${appId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setApps((prev) =>
          prev.map((a) =>
            a.id === appId
              ? {
                  ...a,
                  liked: !currentlyLiked,
                  likeCount: currentlyLiked
                    ? Math.max(0, a.likeCount - 1)
                    : a.likeCount + 1,
                }
              : a,
          ),
        );
      }
    } catch {
      // Non-critical
    } finally {
      setLikingIds((prev) => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const showEmptyState = !loading && apps.length === 0;
  const isPersonalized = isAuthenticated && token;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page Header */}
      <section className="border-b border-border bg-gradient-to-b from-accent/5 to-background">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">
            {isPersonalized ? 'Your Feed' : 'Trending Apps'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isPersonalized
              ? 'Latest apps from creators you follow.'
              : 'Discover popular apps built by the community.'}
          </p>
        </div>
      </section>

      {/* Feed Content */}
      <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="h-3 w-1/4 rounded bg-muted" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-5 w-2/3 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : showEmptyState ? (
          <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
            {isPersonalized ? (
              <>
                <UserPlus className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h2 className="mt-4 text-lg font-semibold text-primary">Your feed is empty</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Follow creators to see their latest apps here.
                </p>
                <Link
                  href="/explore"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  <Compass className="h-4 w-4" />
                  Explore creators
                </Link>
              </>
            ) : (
              <>
                <Compass className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h2 className="mt-4 text-lg font-semibold text-primary">No apps yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Be the first to build and publish an app.
                </p>
                <Link
                  href="/create"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  Create an App
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-md"
              >
                {/* Creator row */}
                {app.creator && (
                  <div className="flex items-center gap-3 mb-3">
                    <Link
                      href={app.creator.storefrontSlug ? `/${app.creator.storefrontSlug}` : `/creators/${app.creator.id}`}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      {app.creator.avatarUrl ? (
                        <img
                          src={app.creator.avatarUrl}
                          alt={app.creator.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                          {app.creator.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-primary">
                        {app.creator.name}
                      </span>
                    </Link>
                    {app.publishedAt && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(app.publishedAt)}
                      </span>
                    )}
                  </div>
                )}

                {/* App content */}
                <Link href={`/apps/${app.id}`} className="block group">
                  <div className="flex items-start gap-3">
                    {app.iconUrl ? (
                      <img
                        src={app.iconUrl}
                        alt={app.name}
                        className="h-12 w-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-lg font-bold text-accent">
                        {app.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-primary group-hover:text-accent transition-colors">
                        {app.name}
                      </h3>
                      {app.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {app.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Actions row */}
                <div className="mt-4 flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(app.id, app.liked)}
                    disabled={likingIds.has(app.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      app.liked
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-muted-foreground hover:text-red-500'
                    } disabled:opacity-50`}
                  >
                    <Heart className={`h-4 w-4 ${app.liked ? 'fill-current' : ''}`} />
                    {app.likeCount > 0 && <span>{app.likeCount.toLocaleString()}</span>}
                  </button>
                  {app.totalUsers > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {app.totalUsers.toLocaleString()}
                    </span>
                  )}
                  {app.pricingModel === 'free' && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                      Free
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
