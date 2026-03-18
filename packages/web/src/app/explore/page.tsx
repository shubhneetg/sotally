'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { NICHES } from '@sotally/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

export default function ExplorePage() {
  const [nicheCounts, setNicheCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch(`${API_URL}/apps/niche-counts`);
        if (res.ok) {
          const data = await res.json();
          setNicheCounts(data.data || {});
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
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

      {/* Niche Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NICHES.map((niche) => {
            const count = nicheCounts[niche.slug] || 0;
            return (
              <Link
                key={niche.slug}
                href={`/explore/${niche.slug}`}
                className="group relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: `${niche.color}20` }}
                  >
                    {niche.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-primary group-hover:text-accent transition-colors">
                        {niche.shortName}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {niche.description}
                    </p>
                    <div className="mt-3">
                      {loading ? (
                        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {count} {count === 1 ? 'app' : 'apps'}
                        </span>
                      )}
                    </div>
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
