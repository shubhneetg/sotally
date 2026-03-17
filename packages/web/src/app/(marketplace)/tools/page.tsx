'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ToolCard } from '@/components/marketplace/tool-card';
import { api } from '@/lib/api';

interface ApiTool {
  name: string;
  slug: string;
  description: string;
  iconUrl?: string;
  icon?: string;
  avgRating?: number | null;
  rating?: number;
  totalRuns?: number;
  runCount?: number;
  pricing?: { model?: string; creditsPerRun?: number; credits?: number; tiers?: { credits: number }[] };
  creditCost?: number;
  creatorName?: string;
  creatorId?: string;
  creator?: { name?: string };
  category?: { name?: string } | string;
  categorySlug?: string;
  categoryName?: string;
}

interface Tool {
  name: string;
  slug: string;
  description: string;
  icon: string;
  rating: number;
  runCount: number;
  creditCost: number;
  creatorName: string;
  pricingModel?: string;
}

const categoryEmojiMap: Record<string, string> = {
  'marketing': '📈',
  'development': '💻',
  'ai-writing': '✍️',
  'writing': '✍️',
  'data-tools': '📊',
  'data': '📊',
  'productivity': '⚡',
  'business': '💼',
  'education': '🎓',
  'design': '🎨',
};

function getCategoryEmoji(category?: { name?: string } | string): string {
  if (!category) return '🛠️';
  const slug = typeof category === 'string'
    ? category.toLowerCase().replace(/\s+/g, '-')
    : (category.name || '').toLowerCase().replace(/\s+/g, '-');
  return categoryEmojiMap[slug] || '🛠️';
}

function mapToolFromApi(apiTool: ApiTool): Tool {
  const pricingModel = apiTool.pricing?.model;
  let creditCost = apiTool.creditCost ?? apiTool.pricing?.creditsPerRun ?? apiTool.pricing?.credits ?? 0;

  // For tiered pricing, show lowest tier cost
  if (pricingModel === 'tiered' && apiTool.pricing?.tiers?.length) {
    const costs = apiTool.pricing.tiers.map((t) => t.credits).filter((c) => c >= 0);
    creditCost = costs.length > 0 ? Math.min(...costs) : 0;
  }

  // Prefer categorySlug from API for emoji mapping
  const categoryKey = apiTool.categorySlug || apiTool.categoryName || apiTool.category;

  return {
    name: apiTool.name,
    slug: apiTool.slug,
    description: apiTool.description,
    icon: apiTool.iconUrl || apiTool.icon || getCategoryEmoji(categoryKey),
    rating: apiTool.avgRating ?? apiTool.rating ?? 0,
    runCount: apiTool.totalRuns ?? apiTool.runCount ?? 0,
    creditCost,
    creatorName: apiTool.creatorName || apiTool.creator?.name || 'Sotally',
    pricingModel,
  };
}

// Map display names to API category slugs
const categories: { label: string; slug: string }[] = [
  { label: 'All', slug: '' },
  { label: 'AI Writing', slug: 'ai-writing' },
  { label: 'Development', slug: 'development' },
  { label: 'Marketing', slug: 'marketing' },
  { label: 'Data Tools', slug: 'data-tools' },
  { label: 'Productivity', slug: 'productivity' },
  { label: 'Business', slug: 'business' },
];

const PER_PAGE = 24;

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTools, setTotalTools] = useState(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTools = useCallback(async (q?: string, categorySlug?: string, currentPage = 1, sortBy = 'popular') => {
    setLoading(true);
    setError(null);
    try {
      const params: { q?: string; category?: string; page?: number; per_page?: number; sort?: string } = {
        page: currentPage,
        per_page: PER_PAGE,
        sort: sortBy,
      };
      if (q) params.q = q;
      if (categorySlug) params.category = categorySlug;
      const res = (await api.tools.list(params)) as {
        success: boolean;
        data: { items: ApiTool[]; totalPages?: number; total?: number } | ApiTool[];
      };
      const data = Array.isArray(res.data) ? { items: res.data } : res.data;
      const rawItems = data.items || [];
      setTools(rawItems.map(mapToolFromApi));
      setTotalPages((data as { totalPages?: number }).totalPages ?? 1);
      setTotalTools((data as { total?: number }).total ?? rawItems.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools(debouncedSearch || undefined, activeCategory || undefined, page, sort);
  }, [activeCategory, fetchTools, debouncedSearch, page, sort]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(slug);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-primary sm:text-4xl">Explore Tools</h1>
          <p className="text-muted-foreground">
            Browse our marketplace of tools. Pay per use, no subscriptions.
          </p>
        </div>

        {/* Search */}
        <div className="mt-6">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search tools..."
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>

        {/* Category Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {categories.map((cat) => {
            const isActive = cat.slug === activeCategory;
            return (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border border-border text-muted-foreground hover:bg-muted'
                }`}
                aria-pressed={isActive}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Results Count + Sorting */}
        {!loading && !error && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalTools > 0
                ? `Showing ${tools.length} of ${totalTools} tool${totalTools !== 1 ? 's' : ''}`
                : ''}
            </p>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="h-5 w-10 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tool Grid */}
        {!loading && !error && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tools.length > 0 ? (
                tools.map((tool) => (
                  <ToolCard key={tool.slug} {...tool} pricingModel={tool.pricingModel} />
                ))
              ) : (
                <div className="col-span-full py-16 text-center">
                  <svg className="mx-auto h-12 w-12 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <h3 className="mt-4 text-base font-semibold text-primary">
                    {search
                      ? `No tools found for "${search}"`
                      : 'No tools found'}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a different search or browse all tools.
                  </p>
                  {(search || activeCategory) && (
                    <button
                      onClick={() => {
                        setSearch('');
                        setDebouncedSearch('');
                        setActiveCategory('');
                        setPage(1);
                      }}
                      className="mt-4 inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
  );
}
