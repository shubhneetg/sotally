'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, TrendingUp, Eye, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { NICHES } from '@sotally/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface FeaturedApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  niche: string | null;
  viewCount: number;
  creatorName: string | null;
  iconUrl: string | null;
}

interface NicheApps {
  [nicheSlug: string]: FeaturedApp[];
}

export default function ExplorePage() {
  const [nicheCounts, setNicheCounts] = useState<Record<string, number>>({});
  const [trendingApps, setTrendingApps] = useState<FeaturedApp[]>([]);
  const [nicheApps, setNicheApps] = useState<NicheApps>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [countsRes, featuredRes] = await Promise.all([
          fetch(`${API_URL}/apps/niche-counts`),
          fetch(`${API_URL}/apps/featured`),
        ]);

        if (countsRes.ok) {
          const data = await countsRes.json();
          setNicheCounts(data.data || {});
        }

        if (featuredRes.ok) {
          const data = await featuredRes.json();
          const apps: FeaturedApp[] = Array.isArray(data.data)
            ? data.data
            : data.data?.items || [];
          setTrendingApps(apps.slice(0, 8));

          // Group remaining apps by niche for horizontal rows
          const grouped: NicheApps = {};
          for (const app of apps) {
            if (app.niche) {
              if (!grouped[app.niche]) grouped[app.niche] = [];
              grouped[app.niche].push(app);
            }
          }
          setNicheApps(grouped);
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalApps = Object.values(nicheCounts).reduce((sum, c) => sum + c, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-accent/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-primary sm:text-4xl lg:text-5xl">
            Explore Apps
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Discover apps built by creators across {NICHES.length} niches. Find tools for your audience or get inspired to build your own.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm text-muted-foreground hover:border-accent/50 hover:text-foreground transition-all shadow-sm"
            >
              <Search className="h-4 w-4" />
              Search all apps...
            </Link>
          </div>
          {totalApps > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              {totalApps.toLocaleString()} published apps
            </p>
          )}
        </div>
      </section>

      {/* Trending Apps */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold text-primary">Trending</h2>
          </div>
        </div>
        {loading ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : trendingApps.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {trendingApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No trending apps yet. Be the first to publish!</p>
        )}
      </section>

      {/* Horizontal rows per niche */}
      {NICHES.filter((n) => (nicheApps[n.slug]?.length || 0) > 0).map((niche) => (
        <section key={niche.slug} className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{niche.icon}</span>
              <h2 className="text-lg font-bold text-primary">{niche.shortName}</h2>
            </div>
            <Link
              href={`/explore/${niche.slug}`}
              className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {nicheApps[niche.slug]!.map((app) => (
              <div key={app.id} className="w-60 shrink-0">
                <AppCard app={app} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Niche Category Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-primary">Browse by Niche</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {NICHES.map((niche) => {
            const count = nicheCounts[niche.slug] || 0;
            return (
              <Link
                key={niche.slug}
                href={`/explore/${niche.slug}`}
                className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                    style={{ backgroundColor: `${niche.color}20` }}
                  >
                    {niche.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors">
                      {niche.shortName}
                    </h3>
                    {loading ? (
                      <div className="mt-1 h-3 w-12 animate-pulse rounded bg-muted" />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {count} {count === 1 ? 'app' : 'apps'}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-accent/5 py-12 text-center">
        <h2 className="text-2xl font-bold text-primary">Don&apos;t see what you need?</h2>
        <p className="mt-2 text-muted-foreground">Create your own app in under 5 minutes with AI.</p>
        <Link
          href="/create"
          className="mt-6 inline-flex items-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          Create an App
        </Link>
      </section>

      <Footer />
    </div>
  );
}

function AppCard({ app }: { app: FeaturedApp }) {
  const niche = NICHES.find((n) => n.slug === app.niche);
  return (
    <Link
      href={`/studio/${app.id}`}
      className="group block rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-lg">
          {app.iconUrl ? (
            <img src={app.iconUrl} alt={app.name} className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <Sparkles className="h-5 w-5 text-accent" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
            {app.name}
          </h3>
          {app.creatorName && (
            <p className="text-xs text-muted-foreground truncate">by {app.creatorName}</p>
          )}
        </div>
      </div>
      {app.description && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{app.description}</p>
      )}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        {niche && (
          <span className="inline-flex items-center gap-1">
            <span>{niche.icon}</span>
            {niche.shortName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {(app.viewCount || 0).toLocaleString()}
        </span>
      </div>
    </Link>
  );
}
