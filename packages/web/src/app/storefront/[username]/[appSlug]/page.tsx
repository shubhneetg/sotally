'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Heart, Share2, Flag, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface AppDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  creatorName: string;
  creatorSlug: string;
  published: boolean;
  iconUrl: string | null;
}

export default function AppRunnerPage() {
  const params = useParams();
  const username = params.username as string;
  const appSlug = params.appSlug as string;
  const { isAuthenticated, token } = useAuthStore();
  const { addToast } = useToast();

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    async function fetchApp() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/apps/by-slug?creator=${encodeURIComponent(username)}&slug=${encodeURIComponent(appSlug)}`
        );
        if (!res.ok) {
          setError(res.status === 404 ? 'not-found' : 'Failed to load app');
          return;
        }
        const data = await res.json();
        const appData = data.data || data;
        if (!appData.published && !appData.id) {
          setError('not-found');
          return;
        }
        setApp(appData);
      } catch {
        setError('Failed to load app');
      } finally {
        setLoading(false);
      }
    }

    fetchApp();
  }, [username, appSlug]);

  const handleLike = async () => {
    if (!isAuthenticated || !token || !app) {
      addToast('Log in to like apps', 'info');
      return;
    }
    try {
      await fetch(`${API_URL}/apps/${app.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      setLiked(!liked);
    } catch {
      addToast('Failed to update like', 'error');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: app?.name, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      addToast('Link copied to clipboard', 'success');
    }
  };

  const handleReport = () => {
    addToast('Report submitted. We will review this app.', 'info');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="h-4 w-96 rounded bg-muted" />
          <div className="mt-6 aspect-video w-full rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (error === 'not-found' || (!loading && !app)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-muted">
          <span className="text-5xl font-bold text-muted-foreground">404</span>
        </div>
        <h1 className="mt-8 text-2xl font-bold text-foreground">App not found</h1>
        <p className="mt-2 text-muted-foreground">
          This app doesn&apos;t exist or hasn&apos;t been published yet.
        </p>
        <Link
          href={`/storefront/${username}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to storefront
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

  if (!app) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/storefront/${username}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {username}&apos;s storefront
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-primary">{app.name}</h1>
          <p className="mt-1 text-muted-foreground">{app.description}</p>
        </div>
      </div>

      {/* Iframe */}
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <iframe
          src={`${API_URL}/apps/${app.id}/bundle`}
          sandbox="allow-scripts allow-forms allow-popups"
          className="h-[70vh] w-full border-0"
          title={app.name}
        />
      </div>

      {/* Action bar */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleLike}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            liked
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          {liked ? 'Liked' : 'Like'}
        </button>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
        <button
          onClick={handleReport}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Flag className="h-4 w-4" />
          Report
        </button>
        <a
          href={`${API_URL}/apps/${app.id}/bundle`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Open in new tab
        </a>
      </div>
    </div>
  );
}
