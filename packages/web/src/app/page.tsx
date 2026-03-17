'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

function mapToolFromApi(apiTool: any): Tool {
  return {
    name: apiTool.name,
    slug: apiTool.slug,
    description: apiTool.description,
    icon: apiTool.iconUrl || apiTool.icon || '🛠️',
    rating: apiTool.avgRating ?? apiTool.rating ?? 0,
    runCount: apiTool.totalRuns ?? apiTool.runCount ?? 0,
    creditCost: apiTool.creditCost ?? apiTool.pricing?.creditsPerRun ?? apiTool.pricing?.credits ?? 0,
    creatorName: apiTool.creatorName || apiTool.creator?.name || 'Sotally',
  };
}

const steps = [
  {
    number: '1',
    title: 'Browse',
    description: 'Explore tools across categories like design, dev, marketing, and more.',
  },
  {
    number: '2',
    title: 'Run',
    description: 'Use any tool instantly -- no installs, no subscriptions, no commitments.',
  },
  {
    number: '3',
    title: 'Pay only for what you use',
    description: 'Each tool costs a few credits per run. No monthly fees, ever.',
  },
];

export default function HomePage() {
  const [featuredTools, setFeaturedTools] = useState<Tool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [trendingTools, setTrendingTools] = useState<Tool[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = (await api.tools.list({ sort: 'popular', page: 1 })) as {
          success: boolean;
          data: { items: any[] } | any[];
        };
        const rawItems = Array.isArray(res.data) ? res.data : (res.data as { items: any[] }).items || [];
        setFeaturedTools(rawItems.slice(0, 6).map(mapToolFromApi));
      } catch {
        // Non-critical; landing page will just show no featured tools
      } finally {
        setToolsLoading(false);
      }
    }
    fetchFeatured();

    async function fetchTrending() {
      try {
        const res = (await api.tools.trending()) as {
          success: boolean;
          data: any[];
        };
        setTrendingTools(Array.isArray(res.data) ? res.data.slice(0, 6).map(mapToolFromApi) : []);
      } catch {
        // Non-critical
      } finally {
        setTrendingLoading(false);
      }
    }
    fetchTrending();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-primary">
            Sotally
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Browse Tools
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          Software without subscriptions.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Pay only for what you use. No subscriptions.
        </p>
        <div className="mt-10">
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-accent px-6 py-3 text-base font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors"
          >
            Get Started Free — 50 Credits
          </Link>
        </div>
      </section>

      {/* Featured Tools */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">Featured Tools</h2>
        <p className="mt-2 text-muted-foreground">Popular tools our community loves.</p>
        {toolsLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
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
              </div>
            ))}
          </div>
        ) : featuredTools.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((tool) => (
              <ToolCard key={tool.slug} {...tool} />
            ))}
          </div>
        ) : null}
        <div className="mt-10 text-center">
          <Link
            href="/tools"
            className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-primary hover:bg-muted transition-colors"
          >
            Browse All Tools
          </Link>
        </div>
      </section>

      {/* Trending Tools */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">Trending Tools</h2>
        <p className="mt-2 text-muted-foreground">Most-used tools this week.</p>
        {trendingLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
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
              </div>
            ))}
          </div>
        ) : trendingTools.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trendingTools.map((tool) => (
              <ToolCard key={tool.slug} {...tool} />
            ))}
          </div>
        ) : null}
      </section>

      {/* How it Works */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl">
            How it works
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
                  {step.number}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Creators */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">For Creators</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Turn your expertise into income. No coding required.
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Package your scripts, APIs, or workflows as tools. Set your credit price. Earn every time
          someone runs your tool.
        </p>
        <div className="mt-8">
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Creating
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-primary">Product</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground">Browse Tools</Link></li>
                <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link href="/creator" className="text-sm text-muted-foreground hover:text-foreground">For Creators</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">Company</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">Connect</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="https://twitter.com/sotally" className="text-sm text-muted-foreground hover:text-foreground">Twitter</a></li>
                <li><a href="https://github.com/sotally" className="text-sm text-muted-foreground hover:text-foreground">GitHub</a></li>
                <li><a href="https://discord.gg/sotally" className="text-sm text-muted-foreground hover:text-foreground">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sotally. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
