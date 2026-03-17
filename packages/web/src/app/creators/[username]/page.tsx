'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface CreatorTool {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string | null;
  pricing: Record<string, unknown>;
  totalRuns: number;
  avgRating: string | null;
  createdAt: string;
}

interface CreatorProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  specialization: string | null;
  website: string | null;
  socialLinks: Record<string, string> | null;
  level: string;
  verified: boolean;
  memberSince: string;
  stats: {
    totalTools: number;
    totalRuns: number;
    avgRating: string | null;
    followerCount?: number;
  };
  tools: CreatorTool[];
}

export default function CreatorStorefrontPage() {
  const params = useParams();
  const username = params.username as string;
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    async function load() {
      try {
        const res = (await api.creators.storefront(username)) as {
          success: boolean;
          data: CreatorProfile;
        };
        if (res.success) {
          setCreator(res.data);
          setFollowerCount(res.data.stats.followerCount ?? 0);

          // Check follow status
          if (res.data.id) {
            try {
              const followRes = (await api.creators.following(token, res.data.id)) as {
                success: boolean;
                data: { following: boolean; followerCount: number };
              };
              if (followRes.success) {
                setIsFollowing(followRes.data.following);
                setFollowerCount(followRes.data.followerCount);
              }
            } catch {
              // Not critical if follow check fails
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load creator profile');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [username, token]);

  const handleFollow = useCallback(async () => {
    if (!isAuthenticated || !token || !creator) return;
    setFollowLoading(true);
    try {
      const res = (await api.creators.follow(token, creator.id)) as {
        success: boolean;
        data: { following: boolean };
      };
      if (res.success) {
        setIsFollowing(res.data.following);
        setFollowerCount((prev) => prev + (res.data.following ? 1 : -1));
      }
    } catch {
      // Silently fail
    } finally {
      setFollowLoading(false);
    }
  }, [isAuthenticated, token, creator]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="space-y-8">
          <div className="h-48 animate-pulse rounded-2xl bg-muted" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary">Creator Not Found</h1>
          <p className="mt-2 text-muted-foreground">{error || 'This creator profile does not exist.'}</p>
          <Link href="/tools">
            <Button variant="accent" className="mt-6">
              Browse Tools
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const specializations = creator.specialization
    ? creator.specialization.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/5 via-background to-accent/10 border border-border p-8 sm:p-10">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-4xl font-bold text-accent shadow-sm ring-2 ring-accent/20">
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.name}
                className="h-24 w-24 rounded-2xl object-cover"
              />
            ) : (
              creator.name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-primary">{creator.name}</h1>
              {creator.verified && (
                <Badge variant="accent" className="gap-1">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  Verified
                </Badge>
              )}
              <Badge variant="muted" className="capitalize">{creator.level}</Badge>
            </div>

            {/* Specialization badges */}
            {specializations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {specializations.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}

            {creator.bio && (
              <p className="mt-3 max-w-2xl text-foreground/80 leading-relaxed">{creator.bio}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:items-end">
            {isAuthenticated ? (
              <Button
                variant={isFollowing ? 'outline' : 'accent'}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
              </Button>
            ) : (
              <Link href={`/login?redirect=/creators/${username}`}>
                <Button variant="accent">Follow</Button>
              </Link>
            )}
            {followerCount > 0 && (
              <span className="text-xs text-muted-foreground">{followerCount} follower{followerCount !== 1 ? 's' : ''}</span>
            )}
            {creator.website && (
              <a
                href={creator.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                {creator.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-primary">{creator.stats.totalTools}</div>
            <p className="mt-1 text-sm text-muted-foreground">Published Tools</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-primary">
              {creator.stats.totalRuns.toLocaleString()}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Total Runs</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-primary">
              {creator.stats.avgRating ? `${creator.stats.avgRating}/5` : '--'}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Avg Rating</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <div className="text-lg font-bold text-primary">
              {new Date(creator.memberSince).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
              })}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Member Since</p>
          </CardContent>
        </Card>
      </div>

      {/* Tool Grid */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-primary">Published Tools</h2>
          <span className="text-sm text-muted-foreground">{creator.tools.length} tool{creator.tools.length !== 1 ? 's' : ''}</span>
        </div>
        {creator.tools.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creator.tools.map((tool) => (
              <Link key={tool.id} href={`/tools/${tool.slug}`}>
                <Card className="group h-full transition-all hover:shadow-lg hover:border-accent/30 hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-lg font-bold text-accent transition-colors group-hover:bg-accent/20">
                        {tool.iconUrl ? (
                          <img src={tool.iconUrl} alt="" className="h-12 w-12 rounded-xl" />
                        ) : (
                          tool.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-base group-hover:text-accent transition-colors">
                          {tool.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                        {tool.totalRuns.toLocaleString()} runs
                      </span>
                      {tool.avgRating && parseFloat(tool.avgRating) > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {parseFloat(tool.avgRating).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <svg className="mx-auto h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 5.384a2.025 2.025 0 01-2.853-2.853l5.384-5.384m2.853 2.853l5.384-5.384a2.025 2.025 0 00-2.853-2.853l-5.384 5.384m2.853 2.853l-2.853-2.853" />
            </svg>
            <p className="mt-4 text-muted-foreground">This creator hasn't published any tools yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
