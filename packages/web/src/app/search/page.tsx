'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Users, Heart, X } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

const NICHE_FILTERS = [
  { value: '', label: 'All niches' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'astrology', label: 'Astrology' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'language', label: 'Language' },
  { value: 'business', label: 'Business' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'content', label: 'Content' },
  { value: 'design', label: 'Design' },
];

interface AppResult {
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
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
    storefrontSlug: string | null;
  } | null;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get('q') || '';
  const initialNiche = searchParams.get('niche') || '';

  const [query, setQuery] = useState(initialQ);
  const [nicheFilter, setNicheFilter] = useState(initialNiche);
  const [results, setResults] = useState<AppResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!initialQ);

  const doSearch = useCallback(async (q: string, niche: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: q.trim() });
      if (niche) params.set('niche', niche);
      const res = await fetch(`${API_URL}/apps/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.data || []);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Search on mount if query param exists
  useEffect(() => {
    if (initialQ) {
      doSearch(initialQ, initialNiche);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams({ q: query.trim() });
    if (nicheFilter) params.set('niche', nicheFilter);
    router.push(`/search?${params}`);
    doSearch(query, nicheFilter);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    router.push('/search');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary sm:text-4xl">Search Apps</h1>
          <p className="mt-2 text-muted-foreground">
            Find apps by keyword across all niches.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mt-8 mx-auto max-w-2xl">
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for apps... e.g., budget tracker, meditation timer"
                className="w-full rounded-xl border border-border bg-card pl-12 pr-10 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!query.trim()}
              className="rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
          </div>

          {/* Niche Filter */}
          <div className="mt-4 flex flex-wrap gap-2">
            {NICHE_FILTERS.map((nf) => (
              <button
                key={nf.value}
                type="button"
                onClick={() => {
                  setNicheFilter(nf.value);
                  if (query.trim()) {
                    const params = new URLSearchParams({ q: query.trim() });
                    if (nf.value) params.set('niche', nf.value);
                    router.push(`/search?${params}`);
                    doSearch(query, nf.value);
                  }
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  nicheFilter === nf.value
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {nf.label}
              </button>
            ))}
          </div>
        </form>

        {/* Results */}
        <div className="mt-10">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searched && results.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
              <Search className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold text-primary">No results found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                No published apps match &quot;{searchParams.get('q')}&quot;. Try different keywords or{' '}
                <Link href="/create" className="text-accent hover:text-accent/80">
                  create your own app
                </Link>
                .
              </p>
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="mb-6 text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{searchParams.get('q')}&quot;
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((app) => (
                  <Link
                    key={app.id}
                    href={`/apps/${app.id}`}
                    className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xl">
                        {app.iconUrl ? (
                          <img src={app.iconUrl} alt={app.name} className="h-12 w-12 rounded-lg object-cover" />
                        ) : (
                          '🚀'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
                          {app.name}
                        </h3>
                        {app.creator && (
                          <p className="text-xs text-muted-foreground">by {app.creator.name}</p>
                        )}
                        {app.description && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                            {app.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      {app.niche && (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-medium capitalize">
                          {app.niche}
                        </span>
                      )}
                      {app.totalUsers > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {app.totalUsers.toLocaleString()}
                        </span>
                      )}
                      {app.likeCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {app.likeCount.toLocaleString()}
                        </span>
                      )}
                      {app.pricingModel === 'free' && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600 font-medium">
                          Free
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : !searched ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                Enter a search term to find apps, or{' '}
                <Link href="/explore" className="text-accent hover:text-accent/80">
                  browse by niche
                </Link>
                .
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <Footer />
    </div>
  );
}
