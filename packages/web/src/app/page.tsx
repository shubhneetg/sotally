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

const categories = [
  { icon: '💻', name: 'Development', slug: 'development' },
  { icon: '📈', name: 'Marketing', slug: 'marketing' },
  { icon: '✍️', name: 'Writing', slug: 'ai-writing' },
  { icon: '📊', name: 'Data Tools', slug: 'data-tools' },
  { icon: '⚡', name: 'Productivity', slug: 'productivity' },
  { icon: '💼', name: 'Business', slug: 'business' },
  { icon: '🎓', name: 'Education', slug: 'education' },
  { icon: '🎨', name: 'Design', slug: 'design' },
];

const integrationLogos = [
  { name: 'GitHub', icon: '🐙' },
  { name: 'Slack', icon: '💬' },
  { name: 'Notion', icon: '📝' },
  { name: 'HubSpot', icon: '🧲' },
  { name: 'Discord', icon: '🎮' },
  { name: 'Stripe', icon: '💳' },
  { name: 'Jira', icon: '🎫' },
  { name: 'Airtable', icon: '📋' },
  { name: 'Mailchimp', icon: '📧' },
  { name: 'Linear', icon: '📐' },
];

export default function HomePage() {
  const [featuredTools, setFeaturedTools] = useState<Tool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = (await api.tools.list({ sort: 'popular', page: 1, per_page: 6 })) as {
          success: boolean;
          data: { items: any[] } | any[];
        };
        const rawItems = Array.isArray(res.data) ? res.data : (res.data as { items: any[] }).items || [];
        setFeaturedTools(rawItems.slice(0, 6).map(mapToolFromApi));
      } catch {
        // Non-critical
      } finally {
        setToolsLoading(false);
      }
    }
    fetchFeatured();
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
            <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tools</Link>
            <Link href="/integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Integrations</Link>
            <Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Guides</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
            <Link href="/register" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="inline-flex items-center rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm font-medium text-accent mb-6">
            50 free credits on signup — no credit card needed
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
            AI-powered software.
            <br />
            <span className="text-accent">No subscriptions.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Access 50+ AI tools for development, marketing, writing, and more. Pay only for what you use with credits. Build your own tools and earn from every run.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/tools"
              className="inline-flex items-center rounded-lg bg-accent px-6 py-3 text-base font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors"
            >
              Browse Tools
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-base font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">56+</div>
              <div className="text-xs text-muted-foreground">AI Tools</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">100+</div>
              <div className="text-xs text-muted-foreground">Integrations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">15</div>
              <div className="text-xs text-muted-foreground">Active Connectors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">8</div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Quick Links */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl">Find tools for your role</h2>
        <p className="text-center mt-2 text-muted-foreground">AI tools organized by what you do.</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/tools?category=${cat.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-sm font-semibold text-primary">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Tools */}
      <section className="bg-muted/20 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary sm:text-3xl">Popular Tools</h2>
              <p className="mt-2 text-muted-foreground">Most-used tools by our community.</p>
            </div>
            <Link href="/tools" className="text-sm font-medium text-accent hover:text-accent/80">
              View all
            </Link>
          </div>
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
        </div>
      </section>

      {/* How it Works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl">How it works</h2>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            { num: '1', title: 'Browse', desc: 'Explore 50+ tools across development, marketing, writing, design, and more. Filter by category or search by problem.' },
            { num: '2', title: 'Run', desc: 'Fill in the inputs and click Run. AI processes your request in seconds. No installs, no configuration, no commitments.' },
            { num: '3', title: 'Pay per use', desc: 'Each tool costs a few credits. No monthly fees, ever. Get 50 free credits on signup. Buy more when you need them.' },
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-accent-foreground">
                {step.num}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-primary">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations Strip */}
      <section className="border-y border-border bg-muted/30 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Works with your favorite tools</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
            {integrationLogos.map((i) => (
              <Link
                key={i.name}
                href={`/integrations/${i.name.toLowerCase()}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <span className="text-lg">{i.icon}</span>
                {i.name}
              </Link>
            ))}
            <Link href="/integrations" className="text-sm font-medium text-accent hover:text-accent/80">
              +90 more
            </Link>
          </div>
        </div>
      </section>

      {/* For Creators */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-accent/5 via-background to-accent/10 border border-border p-10 sm:p-14 text-center">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">Build tools. Earn from every run.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Turn your expertise into AI-powered software with our no-code builder. Set your price in credits. Earn 70-85% revenue share from every run. No coding required.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-2xl font-bold text-accent">70-85%</div>
              <div className="text-xs text-muted-foreground mt-1">Revenue share</div>
            </div>
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-2xl font-bold text-accent">15 min</div>
              <div className="text-xs text-muted-foreground mt-1">To build a tool</div>
            </div>
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-2xl font-bold text-accent">$0</div>
              <div className="text-xs text-muted-foreground mt-1">Cost to start</div>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/creator" className="inline-flex items-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
              Start Creating
            </Link>
            <Link href="/guides/creators" className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Creator Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Guides CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">Learn by role</h2>
            <p className="mt-1 text-muted-foreground">Step-by-step guides for developers, marketers, writers, and more.</p>
          </div>
          <Link href="/guides" className="text-sm font-medium text-accent hover:text-accent/80">View all guides</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: '💻', name: 'Developers', slug: 'development' },
            { icon: '📈', name: 'Marketers', slug: 'marketing' },
            { icon: '✍️', name: 'Writers', slug: 'writing' },
            { icon: '🚀', name: 'Getting Started', slug: 'getting-started' },
          ].map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-accent/50 transition-colors">
              <span className="text-xl">{g.icon}</span>
              <span className="text-sm font-semibold text-primary">{g.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-accent/5 border-t border-accent/20 py-16 text-center">
        <h2 className="text-3xl font-bold text-primary">Ready to try AI tools without subscriptions?</h2>
        <p className="mt-3 text-muted-foreground">Sign up free. Get 50 credits. No credit card required.</p>
        <div className="mt-8">
          <Link href="/register" className="inline-flex items-center rounded-lg bg-accent px-8 py-4 text-base font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors">
            Get Started Free — 50 Credits
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
                <li><Link href="/integrations" className="text-sm text-muted-foreground hover:text-foreground">Integrations</Link></li>
                <li><Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground">Guides</Link></li>
                <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link href="/bounties" className="text-sm text-muted-foreground hover:text-foreground">Bounties</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">Creators</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/creator" className="text-sm text-muted-foreground hover:text-foreground">Create Tools</Link></li>
                <li><Link href="/creator/canvas" className="text-sm text-muted-foreground hover:text-foreground">AI Canvas</Link></li>
                <li><Link href="/creator/templates" className="text-sm text-muted-foreground hover:text-foreground">Templates</Link></li>
                <li><Link href="/guides/creators" className="text-sm text-muted-foreground hover:text-foreground">Creator Guide</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">Company</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link></li>
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
