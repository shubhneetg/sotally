'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, Users, Heart } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

const NICHES = [
  { slug: 'wellness', shortName: 'Wellness', icon: '🧘', color: '#6EE7B7' },
  { slug: 'astrology', shortName: 'Astrology', icon: '🔮', color: '#A78BFA' },
  { slug: 'fitness', shortName: 'Fitness', icon: '💪', color: '#60A5FA' },
  { slug: 'education', shortName: 'Education', icon: '📚', color: '#FBBF24' },
  { slug: 'finance', shortName: 'Finance', icon: '💰', color: '#34D399' },
  { slug: 'nutrition', shortName: 'Nutrition', icon: '🥗', color: '#4ADE80' },
  { slug: 'parenting', shortName: 'Parenting', icon: '👶', color: '#F9A8D4' },
  { slug: 'language', shortName: 'Language', icon: '🌍', color: '#38BDF8' },
  { slug: 'business', shortName: 'Business', icon: '💼', color: '#FB923C' },
  { slug: 'real-estate', shortName: 'Real Estate', icon: '🏠', color: '#818CF8' },
  { slug: 'content', shortName: 'Content', icon: '🎬', color: '#F472B6' },
  { slug: 'design', shortName: 'Design', icon: '🎨', color: '#E879F9' },
];

interface AppCard {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  niche: string | null;
  pricingModel: string;
  totalUsers: number;
  likeCount: number;
  creator: {
    name: string;
    storefrontSlug: string | null;
  } | null;
}

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [trendingApps, setTrendingApps] = useState<AppCard[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch(`${API_URL}/apps/explore?limit=6`);
        if (res.ok) {
          const data = await res.json();
          setTrendingApps(data.data || []);
        }
      } catch {
        // Non-critical
      } finally {
        setAppsLoading(false);
      }
    }
    fetchTrending();
  }, []);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      router.push(`/create?prompt=${encodeURIComponent(prompt.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero with Prompt Input */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="inline-flex items-center rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm font-medium text-accent mb-6">
            Describe it. We build it. Under 5 minutes.
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
            Turn words into
            <br />
            <span className="text-accent">working software.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Type what you want in plain English. Get a fully working app on your personal storefront. No coding needed.
          </p>

          {/* Prompt Input CTA */}
          <form onSubmit={handlePromptSubmit} className="mx-auto mt-10 max-w-2xl">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the app you want to create... e.g., 'A calorie tracker with meal logging and weekly trend charts'"
                rows={3}
                className="w-full rounded-xl border border-border bg-card px-5 py-4 pr-28 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none shadow-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePromptSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                Create
              </button>
            </div>
          </form>

          <div className="mt-4 flex items-center justify-center gap-4">
            <Link
              href="/explore"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              or browse existing apps
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { num: '1', title: 'Describe', desc: 'Type what your app should do in plain English. Be as specific or vague as you want.' },
              { num: '2', title: 'Generate', desc: 'AI builds a working React app in seconds. Refine it with conversation — "add dark mode", "change the chart".' },
              { num: '3', title: 'Publish', desc: 'Deploy to your storefront (you.sotally.com). Share with your audience. Set pricing if you want.' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-accent-foreground">
                  {step.num}
                </div>
                <h3 className="mt-4 text-base font-semibold text-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Apps */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary sm:text-3xl">Trending Apps</h2>
              <p className="mt-2 text-muted-foreground">Recently published apps by our creators.</p>
            </div>
            <Link href="/explore" className="text-sm font-medium text-accent hover:text-accent/80 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {appsLoading ? (
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
                </div>
              ))}
            </div>
          ) : trendingApps.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trendingApps.map((app) => (
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
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{app.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
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
          ) : (
            <div className="mt-8 rounded-xl border border-border bg-card px-6 py-12 text-center">
              <p className="text-muted-foreground">No apps published yet. Be the first to create one!</p>
              <Link
                href="/create"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Create an App
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Niche Category Grid */}
      <section className="bg-muted/20 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">Apps for every niche</h2>
            <p className="mt-2 text-muted-foreground">
              {NICHES.length} niches. Thousands of possibilities. Find your audience.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {NICHES.map((niche) => (
              <Link
                key={niche.slug}
                href={`/explore/${niche.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{ backgroundColor: `${niche.color}20` }}
                >
                  {niche.icon}
                </div>
                <span className="text-sm font-semibold text-primary group-hover:text-accent transition-colors">
                  {niche.shortName}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/explore" className="text-sm font-medium text-accent hover:text-accent/80 flex items-center justify-center gap-1">
              Explore all niches <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* For Creators */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-accent/5 via-background to-accent/10 border border-border p-10 sm:p-14 text-center">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">Build apps. Grow your audience.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Turn your expertise into software your audience actually uses. Describe it in words, publish to your storefront, set your pricing. Keep 85% of revenue.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-2xl font-bold text-accent">85%</div>
              <div className="text-xs text-muted-foreground mt-1">Revenue share</div>
            </div>
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-2xl font-bold text-accent">&lt; 5 min</div>
              <div className="text-xs text-muted-foreground mt-1">To first published app</div>
            </div>
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-2xl font-bold text-accent">$0</div>
              <div className="text-xs text-muted-foreground mt-1">Cost to start</div>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/create" className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
              <Sparkles className="h-4 w-4" />
              Start Creating
            </Link>
            <Link href="/onboarding" className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Claim your storefront
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-accent/5 border-t border-accent/20 py-16 text-center">
        <h2 className="text-3xl font-bold text-primary">What will you build?</h2>
        <p className="mt-3 text-muted-foreground">Describe it. We&apos;ll build it. Free to start.</p>
        <div className="mt-8">
          <Link href="/create" className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors">
            <Sparkles className="h-5 w-5" />
            Create Your First App
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
