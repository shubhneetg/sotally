'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Users, Grid3X3, Heart } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface CreatorProfile {
  id: string;
  name: string;
  slug: string;
  bio: string;
  avatarUrl: string | null;
  followerCount: number;
  appCount: number;
}

interface AppCard {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string | null;
  thumbnailUrl: string | null;
  usageCount: number;
}

export default function StorefrontPage() {
  const params = useParams();
  const username = params.username as string;
  const { isAuthenticated, token } = useAuthStore();
  const { addToast } = useToast();

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [apps, setApps] = useState<AppCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    async function fetchStorefront() {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, appsRes] = await Promise.all([
          fetch(`${API_URL}/creator/profile?slug=${encodeURIComponent(username)}`),
          fetch(`${API_URL}/apps/by-creator?slug=${encodeURIComponent(username)}`),
        ]);

        if (!profileRes.ok) {
          if (profileRes.status === 404) {
            setError('not-found');
          } else {
            setError('Failed to load creator profile');
          }
          return;
        }

        const profileData = await profileRes.json();
        const appsData = appsRes.ok ? await appsRes.json() : { data: [] };

        setCreator(profileData.data || profileData);
        const appItems = Array.isArray(appsData.data)
          ? appsData.data
          : appsData.data?.items || [];
        setApps(appItems);
      } catch {
        setError('Failed to load storefront');
      } finally {
        setLoading(false);
      }
    }

    fetchStorefront();
  }, [username]);

  const handleFollow = async () => {
    if (!isAuthenticated || !token || !creator) {
      addToast('Log in to follow creators', 'info');
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch(`${API_URL}/creator/follow/${creator.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setFollowing(!following);
        addToast(following ? 'Unfollowed creator' : 'Following creator!', 'success');
      }
    } catch {
      addToast('Failed to update follow status', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Profile skeleton */}
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-24 w-24 rounded-full bg-muted" />
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
          <div className="flex gap-6 mt-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        </div>
        {/* App grid skeleton */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error === 'not-found') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-muted">
          <span className="text-5xl font-bold text-muted-foreground">404</span>
        </div>
        <h1 className="mt-8 text-2xl font-bold text-foreground">Creator not found</h1>
        <p className="mt-2 text-muted-foreground">
          No creator exists with the username &quot;{username}&quot;.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!creator) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Creator Profile */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/20 text-3xl font-bold text-accent">
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creator.name}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            creator.name.charAt(0).toUpperCase()
          )}
        </div>
        <h1 className="mt-4 text-2xl font-bold text-primary">{creator.name}</h1>
        {creator.bio && (
          <p className="mt-2 max-w-lg text-muted-foreground">{creator.bio}</p>
        )}
        <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {creator.followerCount} followers
          </span>
          <span className="flex items-center gap-1.5">
            <Grid3X3 className="h-4 w-4" />
            {creator.appCount} apps
          </span>
        </div>
        {isAuthenticated && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={cn(
              'mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
              following
                ? 'border border-border bg-card text-foreground hover:bg-muted'
                : 'bg-accent text-accent-foreground hover:bg-accent/90'
            )}
          >
            <Heart className={cn('h-4 w-4', following && 'fill-current')} />
            {following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Apps Grid */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-primary">Apps</h2>
        {apps.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-card px-6 py-12 text-center">
            <p className="text-muted-foreground">
              This creator hasn&apos;t published any apps yet.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <Link
                key={app.id}
                href={`/storefront/${username}/${app.slug}`}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xl">
                    {app.iconUrl ? (
                      <img
                        src={app.iconUrl}
                        alt={app.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      '🚀'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
                      {app.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {app.description}
                    </p>
                  </div>
                </div>
                {app.usageCount > 0 && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    {app.usageCount.toLocaleString()} uses
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
