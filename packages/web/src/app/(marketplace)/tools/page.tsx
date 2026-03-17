'use client';

import { useState, useEffect, useCallback } from 'react';
import { ToolCard } from '@/components/marketplace/tool-card';
import { api } from '@/lib/api';

interface Tool {
  name: string;
  slug: string;
  description: string;
  icon: string;
  rating: number;
  runCount: number;
  creditCost: number;
  creatorName: string;
}

const categories = ['All', 'Design', 'Development', 'Marketing', 'Data', 'Writing'];

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchTools = useCallback(async (q?: string, category?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: { q?: string; category?: string; page?: number } = { page: 1 };
      if (q) params.q = q;
      if (category && category !== 'All') params.category = category;
      const res = (await api.tools.list(params)) as {
        success: boolean;
        data: { items: Tool[] } | Tool[];
      };
      const items = Array.isArray(res.data) ? res.data : (res.data as { items: Tool[] }).items || [];
      setTools(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools(search || undefined, activeCategory);
  }, [activeCategory, fetchTools, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
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
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                category === activeCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

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
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tools.length > 0 ? (
              tools.map((tool) => (
                <ToolCard key={tool.slug} {...tool} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <p className="text-muted-foreground">No tools found. Try a different search or category.</p>
              </div>
            )}
          </div>
        )}
      </div>
  );
}
