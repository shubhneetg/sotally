'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Users, Heart, Star, Quote } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { NICHE_LANDING } from '@/data/niche-landing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

const NICHE_META: Record<string, { displayName: string; shortName: string; icon: string; color: string; description: string; creatorNoun: string; audienceNoun: string }> = {
  wellness: { displayName: 'Wellness Coaches', shortName: 'Wellness', icon: '🧘', color: '#6EE7B7', description: 'Apps for mindfulness, meditation, and mental health', creatorNoun: 'coach', audienceNoun: 'clients' },
  astrology: { displayName: 'Astrologers & Spiritual Guides', shortName: 'Astrology', icon: '🔮', color: '#A78BFA', description: 'Birth charts, tarot, numerology, and moon phases', creatorNoun: 'guide', audienceNoun: 'seekers' },
  fitness: { displayName: 'Fitness Trainers', shortName: 'Fitness', icon: '💪', color: '#60A5FA', description: 'Workout generators, macro calculators, and progress trackers', creatorNoun: 'trainer', audienceNoun: 'clients' },
  education: { displayName: 'Educators & Tutors', shortName: 'Education', icon: '📚', color: '#FBBF24', description: 'Quizzes, flashcards, study planners, and interactive lessons', creatorNoun: 'teacher', audienceNoun: 'students' },
  finance: { displayName: 'Personal Finance Coaches', shortName: 'Finance', icon: '💰', color: '#34D399', description: 'Budget trackers, calculators, and financial planning tools', creatorNoun: 'coach', audienceNoun: 'clients' },
  nutrition: { displayName: 'Nutritionists & Dietitians', shortName: 'Nutrition', icon: '🥗', color: '#4ADE80', description: 'Meal planners, food trackers, and dietary tools', creatorNoun: 'nutritionist', audienceNoun: 'clients' },
  parenting: { displayName: 'Parenting Coaches', shortName: 'Parenting', icon: '👶', color: '#F9A8D4', description: 'Chore trackers, milestone tools, and family organizers', creatorNoun: 'coach', audienceNoun: 'parents' },
  language: { displayName: 'Language Teachers', shortName: 'Language', icon: '🌍', color: '#38BDF8', description: 'Vocabulary apps, quizzers, and conversation practice tools', creatorNoun: 'teacher', audienceNoun: 'learners' },
  business: { displayName: 'Small Business Coaches', shortName: 'Business', icon: '💼', color: '#FB923C', description: 'Pricing calculators, invoicing tools, and client managers', creatorNoun: 'coach', audienceNoun: 'entrepreneurs' },
  'real-estate': { displayName: 'Real Estate Agents', shortName: 'Real Estate', icon: '🏠', color: '#818CF8', description: 'Mortgage calculators, property analyzers, and market tools', creatorNoun: 'agent', audienceNoun: 'clients' },
  content: { displayName: 'Content Creators', shortName: 'Content', icon: '🎬', color: '#F472B6', description: 'Content planners, analytics tools, and growth calculators', creatorNoun: 'creator', audienceNoun: 'audience' },
  design: { displayName: 'Creative Freelancers', shortName: 'Design', icon: '🎨', color: '#E879F9', description: 'Color palettes, brand tools, and design utilities', creatorNoun: 'designer', audienceNoun: 'clients' },
};

interface AppItem {
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

interface CreatorItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  storefrontSlug: string | null;
  appCount: number;
  followerCount: number;
}

export default function NicheExplorePage() {
  const params = useParams();
  const nicheSlug = params.niche as string;
  const niche = NICHE_META[nicheSlug];
  const landing = NICHE_LANDING[nicheSlug];

  const [apps, setApps] = useState<AppItem[]>([]);
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}/apps/explore?niche=${encodeURIComponent(nicheSlug)}`);
        if (res.ok) {
          const data = await res.json();
          const items: AppItem[] = data.data || [];
          setApps(items);

          // Extract unique creators from apps as featured creators
          const creatorMap = new Map<string, CreatorItem>();
          for (const app of items) {
            if (app.creator && !creatorMap.has(app.creator.id)) {
              creatorMap.set(app.creator.id, {
                id: app.creator.id,
                name: app.creator.name,
                avatarUrl: app.creator.avatarUrl,
                storefrontSlug: app.creator.storefrontSlug,
                appCount: 0,
                followerCount: 0,
              });
            }
            if (app.creator) {
              const existing = creatorMap.get(app.creator.id)!;
              existing.appCount += 1;
            }
          }
          setCreators(Array.from(creatorMap.values()).slice(0, 6));
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [nicheSlug]);

  if (!niche) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-muted">
            <span className="text-5xl font-bold text-muted-foreground">404</span>
          </div>
          <h1 className="mt-8 text-2xl font-bold text-foreground">Niche not found</h1>
          <p className="mt-2 text-muted-foreground">
            &quot;{nicheSlug}&quot; is not a recognized niche.
          </p>
          <Link
            href="/explore"
            className="mt-6 inline-flex items-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Browse all niches
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section
        className="border-b border-border"
        style={{ background: `linear-gradient(to bottom, ${niche.color}08, transparent)` }}
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            All niches
          </Link>
          <div className="flex items-start gap-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl"
              style={{ backgroundColor: `${niche.color}20` }}
            >
              {niche.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">
                {landing ? landing.heroHeadline : niche.displayName}
              </h1>
              <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
                {landing ? landing.heroSubheadline : niche.description}
              </p>
              <div className="mt-6">
                <Link
                  href={`/create?niche=${nicheSlug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  {landing ? landing.ctaText : `Create an app for ${niche.audienceNoun}`}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Apps (from landing data) */}
      {landing && landing.exampleApps.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-primary">What you can build</h2>
          <p className="mt-1 text-sm text-muted-foreground">Example apps created by {niche.creatorNoun}s like you.</p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {landing.exampleApps.map((example, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                  style={{ backgroundColor: `${niche.color}15` }}
                >
                  <Star className="h-5 w-5" style={{ color: niche.color }} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-primary">{example.name}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3">
                  {example.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Creators in this Niche */}
      {creators.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-primary">Featured creators</h2>
            <p className="mt-1 text-sm text-muted-foreground">Top {niche.creatorNoun}s building in {niche.shortName.toLowerCase()}.</p>
            <div className="mt-6 flex flex-wrap gap-4">
              {creators.map((creator) => (
                <Link
                  key={creator.id}
                  href={creator.storefrontSlug ? `/${creator.storefrontSlug}` : `/creators/${creator.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
                >
                  {creator.avatarUrl ? (
                    <img
                      src={creator.avatarUrl}
                      alt={creator.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                      {creator.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-primary">{creator.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {creator.appCount} {creator.appCount === 1 ? 'app' : 'apps'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonial */}
      {landing?.testimonial && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 text-center">
            <Quote className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <blockquote className="mt-4 text-lg text-primary italic">
              &ldquo;{landing.testimonial.quote}&rdquo;
            </blockquote>
            <div className="mt-4">
              <p className="text-sm font-semibold text-primary">{landing.testimonial.name}</p>
              <p className="text-xs text-muted-foreground">{landing.testimonial.role}</p>
            </div>
          </div>
        </section>
      )}

      {/* Published Apps Grid */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-primary">Published apps</h2>
          <p className="mt-1 text-sm text-muted-foreground">Browse apps built for {niche.audienceNoun}.</p>

          <div className="mt-6">
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
            ) : apps.length === 0 ? (
              <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
                <div className="text-4xl">{niche.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-primary">No apps yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Be the first {niche.creatorNoun} to create an app in this niche.
                </p>
                <Link
                  href={`/create?niche=${nicheSlug}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Create the first app
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {apps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/apps/${app.id}`}
                    className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl"
                        style={{ backgroundColor: `${niche.color}15` }}
                      >
                        {app.iconUrl ? (
                          <img src={app.iconUrl} alt={app.name} className="h-12 w-12 rounded-lg object-cover" />
                        ) : (
                          niche.icon
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
                          {app.name}
                        </h3>
                        {app.creator && (
                          <p className="text-xs text-muted-foreground">
                            by {app.creator.name}
                          </p>
                        )}
                        {app.description && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                            {app.description}
                          </p>
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
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-accent/5 py-12 text-center">
        <h2 className="text-2xl font-bold text-primary">Ready to build?</h2>
        <p className="mt-2 text-muted-foreground">
          Create your first {niche.shortName.toLowerCase()} app in under 5 minutes with AI.
        </p>
        <Link
          href={`/create?niche=${nicheSlug}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          {landing ? landing.ctaText : `Create an app for ${niche.audienceNoun}`}
        </Link>
      </section>

      <Footer />
    </div>
  );
}
