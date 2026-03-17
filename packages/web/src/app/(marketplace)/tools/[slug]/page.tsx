'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface Tool {
  name: string;
  slug: string;
  icon: string;
  description: string;
  category: string;
  rating: number;
  runCount: number;
  creditCost: number;
  creatorName: string;
  creatorAvatar: string | null;
}

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-muted-foreground">{rating}</span>
    </div>
  );
}

export default function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuthStore();
  const [tool, setTool] = useState<Tool | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTool() {
      setLoading(true);
      setError(null);
      try {
        const res = (await api.tools.get(slug)) as {
          success: boolean;
          data: Tool;
        };
        setTool(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tool');
      } finally {
        setLoading(false);
      }
    }

    async function fetchReviews() {
      try {
        const res = (await api.tools.reviews(slug)) as {
          success: boolean;
          data: { items: Review[] } | Review[];
        };
        const items = Array.isArray(res.data) ? res.data : (res.data as { items: Review[] }).items || [];
        setReviews(items);
      } catch {
        // Reviews are non-critical; silently ignore
      }
    }

    fetchTool();
    fetchReviews();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 animate-pulse">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-2/3 rounded bg-muted" />
                <div className="h-4 w-1/3 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-1/4 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
          </div>
          <div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="h-10 w-20 mx-auto rounded bg-muted" />
              <div className="mt-6 h-12 w-full rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-primary">Tool not found</h1>
        <p className="mt-2 text-muted-foreground">{error || 'This tool could not be loaded.'}</p>
        <Link href="/tools" className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent/80">
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Left Column -- Tool Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tool Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-3xl">
                {tool.icon}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-primary sm:text-3xl">{tool.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {tool.category && <Badge variant="outline">{tool.category}</Badge>}
                  <StarRating rating={tool.rating} />
                  <span className="text-sm text-muted-foreground">
                    {(tool.runCount || 0).toLocaleString()} runs
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  by <span className="font-medium text-foreground">{tool.creatorName}</span>
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-primary">About this tool</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{tool.description}</p>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-primary">Reviews</h2>
                <div className="mt-4 space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{review.user}</span>
                          <StarRating rating={review.rating} />
                        </div>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column -- Pricing & Action */}
          <div>
            <div className="sticky top-6 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  <span className="text-accent">🪙</span> {tool.creditCost}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">credits per run</p>
              </div>
              {isAuthenticated ? (
                <Link
                  href={`/tools/${tool.slug}/run`}
                  className="mt-6 block w-full rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  Run Tool — {tool.creditCost} Credits
                </Link>
              ) : (
                <div className="mt-6 space-y-3">
                  <Link
                    href={`/login?redirect=/tools/${tool.slug}/run`}
                    className="block w-full rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                  >
                    Log in to Run
                  </Link>
                  <p className="text-center text-xs text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-accent hover:text-accent/80">
                      Sign up for 50 free
                    </Link>
                  </p>
                </div>
              )}
              <div className="mt-6 border-t border-border pt-4">
                <div className="space-y-2 text-sm">
                  {tool.category && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium text-foreground">{tool.category}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total runs</span>
                    <span className="font-medium text-foreground">{(tool.runCount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-medium text-foreground">{tool.rating}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator</span>
                    <span className="font-medium text-foreground">{tool.creatorName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
