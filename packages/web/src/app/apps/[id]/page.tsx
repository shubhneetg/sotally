'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Users, Heart, Star, Clock, Share2, Flag, ExternalLink } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useToast } from '@/components/ui/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface AppDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  longDescription: string | null;
  iconUrl: string | null;
  screenshotUrls: string[];
  niche: string | null;
  tags: string[];
  pricingModel: string;
  requiresAuth: boolean;
  hasAiFeatures: boolean;
  totalSessions: number;
  totalUsers: number;
  likeCount: number;
  avgRating: string | null;
  reviewCount: number;
  status: string;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  bundleUrl: string | null;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
    storefrontSlug: string | null;
  } | null;
}

export default function AppDetailPage() {
  const params = useParams();
  const appId = params.id as string;
  const { addToast } = useToast();

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRunner, setShowRunner] = useState(false);

  useEffect(() => {
    async function fetchApp() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/apps/${appId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('not-found');
          } else {
            setError('Failed to load app');
          }
          return;
        }
        const data = await res.json();
        setApp(data.data);
      } catch {
        setError('Failed to load app');
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [appId]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      addToast('Link copied to clipboard', 'success');
    } catch {
      addToast('Failed to copy link', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-4 w-24 rounded bg-muted mb-8" />
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-2xl bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-64 rounded bg-muted" />
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-4 w-full max-w-lg rounded bg-muted" />
              </div>
            </div>
            <div className="mt-8 h-96 rounded-xl bg-muted" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error === 'not-found') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-muted">
            <span className="text-5xl font-bold text-muted-foreground">404</span>
          </div>
          <h1 className="mt-8 text-2xl font-bold text-foreground">App not found</h1>
          <p className="mt-2 text-muted-foreground">This app may have been removed or doesn&apos;t exist.</p>
          <Link
            href="/explore"
            className="mt-6 inline-flex items-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Explore Apps
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-4 text-sm text-destructive">
            {error || 'Something went wrong'}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formattedDate = app.publishedAt
    ? new Date(app.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to explore
        </Link>

        {/* App Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-3xl">
            {app.iconUrl ? (
              <img src={app.iconUrl} alt={app.name} className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              '🚀'
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary sm:text-3xl">{app.name}</h1>
                {app.creator && (
                  <Link
                    href={`/storefront/${app.creator.storefrontSlug}`}
                    className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    {app.creator.avatarUrl ? (
                      <img src={app.creator.avatarUrl} alt={app.creator.name} className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
                        {app.creator.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    by {app.creator.name}
                  </Link>
                )}
              </div>
              {app.isFeatured && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  Featured
                </span>
              )}
            </div>

            {app.description && (
              <p className="mt-3 text-muted-foreground">{app.description}</p>
            )}

            {/* Stats */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {app.totalUsers > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {app.totalUsers.toLocaleString()} users
                </span>
              )}
              {app.likeCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" />
                  {app.likeCount.toLocaleString()} likes
                </span>
              )}
              {app.avgRating && parseFloat(app.avgRating) > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {parseFloat(app.avgRating).toFixed(1)} ({app.reviewCount})
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formattedDate}
              </span>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {app.niche && (
                <Link
                  href={`/explore/${app.niche}`}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors capitalize"
                >
                  {app.niche}
                </Link>
              )}
              {app.pricingModel === 'free' && (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                  Free
                </span>
              )}
              {app.hasAiFeatures && (
                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-600">
                  AI-powered
                </span>
              )}
              {(app.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              {app.bundleUrl && (
                <button
                  onClick={() => setShowRunner(!showRunner)}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  {showRunner ? 'Hide App' : 'Use App'}
                </button>
              )}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                onClick={() => addToast('Report submitted. We will review this app.', 'info')}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Flag className="h-4 w-4" />
                Report
              </button>
            </div>
          </div>
        </div>

        {/* App Runner (iframe) */}
        {showRunner && app.bundleUrl && (
          <div className="mt-8">
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
                <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
                <a
                  href={app.bundleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  Open in new tab
                </a>
              </div>
              <iframe
                src={app.bundleUrl}
                title={app.name}
                className="w-full border-0"
                style={{ height: '600px' }}
                sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
              />
            </div>
          </div>
        )}

        {/* Long Description */}
        {app.longDescription && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-primary">About this app</h2>
            <div className="mt-3 prose prose-sm prose-muted max-w-none text-muted-foreground">
              <p className="whitespace-pre-wrap">{app.longDescription}</p>
            </div>
          </div>
        )}

        {/* Screenshots */}
        {app.screenshotUrls && app.screenshotUrls.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-primary">Screenshots</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {app.screenshotUrls.map((url, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border">
                  <img
                    src={url}
                    alt={`${app.name} screenshot ${i + 1}`}
                    className="w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section (placeholder) */}
        <div className="mt-10 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary">
              Reviews
              {app.reviewCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({app.reviewCount})
                </span>
              )}
            </h2>
          </div>
          {app.reviewCount === 0 ? (
            <div className="mt-4 rounded-xl border border-border bg-card px-6 py-8 text-center">
              <Star className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No reviews yet. Be the first to review this app.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-border bg-card px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {app.reviewCount} review{app.reviewCount !== 1 ? 's' : ''} — full review UI coming soon.
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
