'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';

function creditsToDollars(credits: number): string {
  return `$${(credits * 0.03).toFixed(2)}`;
}

interface Tool {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  category: string;
  rating: number;
  runCount: number;
  creditCost: number;
  pricingModel: string;
  creatorName: string;
  creatorId: string;
  creatorAvatar: string | null;
}

function mapToolFromApi(apiTool: any): Tool {
  return {
    id: apiTool.id,
    name: apiTool.name,
    slug: apiTool.slug,
    icon: apiTool.iconUrl || apiTool.icon || '🛠️',
    description: apiTool.description,
    category: typeof apiTool.category === 'object' ? apiTool.category?.name || '' : apiTool.category || '',
    rating: apiTool.avgRating ?? apiTool.rating ?? 0,
    runCount: apiTool.totalRuns ?? apiTool.runCount ?? 0,
    creditCost: apiTool.creditCost ?? apiTool.pricing?.creditsPerRun ?? apiTool.pricing?.credits ?? 0,
    pricingModel: apiTool.pricing?.model || 'per_run',
    creatorName: apiTool.creator?.name || apiTool.creatorName || 'Sotally',
    creatorId: apiTool.creatorId || apiTool.creator?.id || '',
    creatorAvatar: apiTool.creator?.avatarUrl || apiTool.creatorAvatar || null,
  };
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

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'misleading', label: 'Misleading' },
  { value: 'broken', label: 'Broken' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'copyright', label: 'Copyright violation' },
  { value: 'malicious', label: 'Malicious' },
  { value: 'other', label: 'Other' },
];

export default function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { isAuthenticated, token } = useAuthStore();
  const { addToast } = useToast();
  const [tool, setTool] = useState<Tool | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similarTools, setSimilarTools] = useState<Tool[]>([]);
  const [creatorTools, setCreatorTools] = useState<Tool[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    async function fetchTool() {
      setLoading(true);
      setError(null);
      try {
        const res = (await api.tools.get(slug)) as {
          success: boolean;
          data: any;
        };
        setTool(mapToolFromApi(res.data));
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

    async function fetchSimilar() {
      try {
        const res = (await api.tools.similar(slug)) as {
          success: boolean;
          data: any[];
        };
        setSimilarTools(Array.isArray(res.data) ? res.data.map(mapToolFromApi) : []);
      } catch {
        // Non-critical
      }
    }

    async function fetchCreatorTools(creatorName: string, currentSlug: string) {
      try {
        const res = (await api.creators.storefront(creatorName)) as {
          success: boolean;
          data: { tools: any[] };
        };
        if (res.success && res.data.tools) {
          setCreatorTools(
            res.data.tools
              .filter((t: any) => t.slug !== currentSlug)
              .slice(0, 6)
              .map(mapToolFromApi)
          );
        }
      } catch {
        // Non-critical
      }
    }

    fetchTool().then(() => {
      // Fetch creator tools after we know the creator name
    });
    fetchReviews();
    fetchSimilar();
  }, [slug]);

  // Fetch creator's other tools when tool data is available
  useEffect(() => {
    if (tool?.creatorName) {
      (async () => {
        try {
          const res = (await api.creators.storefront(tool.creatorName)) as {
            success: boolean;
            data: { tools: any[] };
          };
          if (res.success && res.data.tools) {
            setCreatorTools(
              res.data.tools
                .filter((t: any) => t.slug !== slug)
                .slice(0, 6)
                .map(mapToolFromApi)
            );
          }
        } catch {
          // Non-critical
        }
      })();
    }
  }, [tool?.creatorName, slug]);

  const handleReportSubmit = async () => {
    setReportSubmitting(true);
    try {
      await api.tools.report(slug, {
        reason: reportReason,
        description: reportDescription || undefined,
      });
      addToast('Report submitted. Thank you for helping keep Sotally safe.', 'success');
      setShowReportModal(false);
      setReportReason('spam');
      setReportDescription('');
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to submit report. Please try again.',
        'error'
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!token || !tool) return;
    setReviewSubmitting(true);
    try {
      await api.tools.submitReview(token, {
        toolId: tool.id,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      addToast('Review submitted!', 'success');
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      // Refresh reviews
      const res = (await api.tools.reviews(slug)) as {
        success: boolean;
        data: { items: Review[] } | Review[];
      };
      const items = Array.isArray(res.data) ? res.data : (res.data as { items: Review[] }).items || [];
      setReviews(items);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to submit review', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

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
                  {tool.category && <Badge variant="outline">{typeof tool.category === 'object' ? (tool.category as any)?.name || '' : tool.category}</Badge>}
                  <StarRating rating={tool.rating} />
                  <span className="text-sm text-muted-foreground">
                    {(tool.runCount || 0).toLocaleString()} runs
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  by{' '}
                  <Link href={`/creators/${encodeURIComponent(tool.creatorName)}`} className="font-medium text-foreground hover:text-accent transition-colors">
                    {tool.creatorName}
                  </Link>
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-primary">About this tool</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{tool.description}</p>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">
                  Reviews {reviews.length > 0 && `(${reviews.length})`}
                </h2>
                {isAuthenticated && !showReviewForm && (
                  <Button variant="outline" size="sm" onClick={() => setShowReviewForm(true)}>
                    Write a Review
                  </Button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && isAuthenticated && (
                <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <svg
                            className={`h-6 w-6 transition-colors ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience (optional)..."
                    rows={3}
                    className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="accent" size="sm" onClick={handleReviewSubmit} disabled={reviewSubmitting}>
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{review.user?.name || review.user || 'Anonymous'}</span>
                          <StarRating rating={review.rating} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : review.date}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : !showReviewForm && (
                <p className="mt-4 text-sm text-muted-foreground">No reviews yet. Be the first!</p>
              )}
            </div>
          </div>

          {/* Right Column -- Pricing & Action */}
          <div>
            <div className="sticky top-6 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="text-center">
                {tool.creditCost === 0 || tool.pricingModel === 'free' ? (
                  <>
                    <div className="text-3xl font-bold text-emerald-600">Free</div>
                    <p className="mt-1 text-sm text-muted-foreground">No credits required</p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-primary">
                      <span className="text-accent">🪙</span> {tool.creditCost}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">credits per run (~{creditsToDollars(tool.creditCost)})</p>
                  </>
                )}
              </div>
              <Link
                href={`/tools/${tool.slug}/run`}
                className="mt-6 block w-full rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
              >
                {tool.creditCost === 0 || tool.pricingModel === 'free'
                  ? (isAuthenticated ? 'Run Free Tool' : 'Try Free — No Signup Required')
                  : isAuthenticated
                    ? `Run Tool — ${tool.creditCost} Credits (~${creditsToDollars(tool.creditCost)})`
                    : 'Log in to Run'}
              </Link>
              {!isAuthenticated && tool.creditCost > 0 && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-accent hover:text-accent/80">
                    Sign up for 50 free credits
                  </Link>
                </p>
              )}
              <div className="mt-6 border-t border-border pt-4">
                <div className="space-y-2 text-sm">
                  {tool.category && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium text-foreground">{typeof tool.category === 'object' ? (tool.category as any)?.name || '' : tool.category}</span>
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
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowReportModal(true)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Report this tool
              </button>
            </div>
          </div>
        </div>

        {/* Users also ran */}
        {similarTools.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-primary">Users also ran...</h2>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-border">
              {similarTools.map((similarTool) => (
                <Link
                  key={similarTool.slug}
                  href={`/tools/${similarTool.slug}`}
                  className="flex-shrink-0 w-64 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                      {similarTool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-primary truncate">
                        {similarTool.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {(similarTool.runCount || 0).toLocaleString()} runs
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {similarTool.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* More by this creator */}
        {creatorTools.length > 0 && tool && (
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">More by {tool.creatorName}</h2>
              <Link href={`/creators/${encodeURIComponent(tool.creatorName)}`} className="text-sm text-accent hover:text-accent/80">
                View all
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creatorTools.map((ct) => (
                <Link
                  key={ct.slug}
                  href={`/tools/${ct.slug}`}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                      {ct.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-primary truncate">{ct.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {(ct.runCount || 0).toLocaleString()} runs
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {ct.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowReportModal(false)}
            />
            <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl mx-4">
              <h3 className="text-lg font-semibold text-primary">Report Tool</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Help us maintain quality by reporting issues with this tool.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="report-reason" className="block text-sm font-medium text-foreground">
                    Reason
                  </label>
                  <select
                    id="report-reason"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="report-description" className="block text-sm font-medium text-foreground">
                    Description <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    id="report-description"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={3}
                    placeholder="Tell us more about the issue..."
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReportModal(false)}
                    disabled={reportSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleReportSubmit}
                    disabled={reportSubmitting}
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
