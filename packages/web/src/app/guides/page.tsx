import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Knowledge Base — AI Tool Guides for Every Role | Sotally',
  description: 'Step-by-step guides to using AI tools for development, marketing, writing, design, education, and more. Learn how to automate your workflow with Sotally.',
};

export default function GuidesPage() {
  const featured = GUIDES.filter(g => ['development', 'marketing', 'getting-started'].includes(g.id));
  const rest = GUIDES.filter(g => !['development', 'marketing', 'getting-started'].includes(g.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary sm:text-5xl">Knowledge Base</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Step-by-step guides to automating your workflow with AI. Find your role, follow the playbook.
        </p>
      </div>

      {/* Featured Guides */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Most Popular</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          {featured.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-accent/50 hover:-translate-y-1"
            >
              <div className="text-3xl mb-3">{guide.icon}</div>
              <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">{guide.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{guide.subtitle}</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {guide.persona.avatar}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{guide.persona.name}</p>
                  <p className="text-xs text-muted-foreground">{guide.persona.role}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-accent font-medium">
                {guide.useCases.length} use cases
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* All Guides */}
      <div className="mt-12">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">All Guides</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-accent/50 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                {guide.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors">{guide.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{guide.subtitle}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {guide.persona.name} &middot; {guide.useCases.length} use cases
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-2xl bg-accent/5 border border-accent/20 p-8 text-center">
        <h2 className="text-xl font-bold text-primary">Don't see your role?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sotally works for any profession. Browse 50+ tools or build your own with no code.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link href="/tools" className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
            Browse Tools
          </Link>
          <Link href="/guides/creators" className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Build Your Own
          </Link>
        </div>
      </div>
    </div>
  );
}
