'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Sparkles } from 'lucide-react';
import { NICHES } from '@sotally/shared';

const FEATURED_NICHES = NICHES.slice(0, 6);

export default function WelcomePage() {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary sm:text-4xl">
          Welcome to Sotally, {firstName}!
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Describe any app in plain English and we&apos;ll build it for you. Publish to your storefront in minutes.
        </p>
      </div>

      {/* Quick Start CTA */}
      <div className="mt-10 rounded-2xl bg-gradient-to-br from-accent/5 via-background to-accent/10 border border-accent/20 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-primary">Create your first app</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Just describe what it should do — AI builds a working React app for you. No coding required.
        </p>
        <div className="mt-6">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Start Creating
          </Link>
        </div>
      </div>

      {/* Browse Niches */}
      <div className="mt-12">
        <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Popular niches to explore
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FEATURED_NICHES.map((niche) => (
            <Link
              key={niche.slug}
              href={`/explore/${niche.slug}`}
              className="group flex flex-col items-center rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="text-2xl">{niche.icon}</span>
              <span className="mt-2 text-sm font-semibold text-primary group-hover:text-accent transition-colors">
                {niche.shortName}
              </span>
              <span className="mt-0.5 text-[10px] text-muted-foreground text-center">
                {niche.description}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="/explore" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
            View all niches
          </Link>
        </div>
      </div>

      {/* Skip */}
      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Skip to dashboard
        </Link>
      </div>
    </div>
  );
}
