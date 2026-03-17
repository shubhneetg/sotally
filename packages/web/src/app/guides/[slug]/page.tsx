import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GUIDES, getGuideBySlug } from '@/data/guides';

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: 'Guide Not Found' };
  return {
    title: guide.seoTitle,
    description: guide.seoDescription,
    openGraph: { title: guide.seoTitle, description: guide.seoDescription, url: `https://sotally.com/guides/${slug}` },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const relatedGuides = guide.relatedGuides
    .map(s => GUIDES.find(g => g.slug === s))
    .filter(Boolean);

  // Schema.org
  const schemas = [
    {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: guide.title, description: guide.seoDescription,
      author: { '@type': 'Organization', name: 'Sotally' },
      publisher: { '@type': 'Organization', name: 'Sotally' },
      datePublished: '2026-03-17',
      url: `https://sotally.com/guides/${slug}`,
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: guide.faq.map(f => ({
        '@type': 'Question', name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    },
    {
      '@context': 'https://schema.org', '@type': 'HowTo',
      name: `How to Get Started with ${guide.title}`,
      step: guide.gettingStarted.map((s, i) => ({
        '@type': 'HowToStep', position: i + 1, name: s, text: s,
      })),
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Guides', item: 'https://sotally.com/guides' },
        { '@type': 'ListItem', position: 2, name: guide.title, item: `https://sotally.com/guides/${slug}` },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/guides" className="hover:text-accent">Guides</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{guide.title}</span>
      </nav>

      {/* Hero */}
      <div className="flex items-start gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted text-3xl">{guide.icon}</div>
        <div>
          <h1 className="text-3xl font-bold text-primary">{guide.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{guide.subtitle}</p>
        </div>
      </div>

      {/* Persona Card */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-lg font-bold text-accent">
            {guide.persona.avatar}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Meet {guide.persona.name}
            </h2>
            <p className="text-sm text-muted-foreground">{guide.persona.role} {guide.persona.company}</p>
            <div className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {guide.persona.story}
            </div>
            <blockquote className="mt-4 border-l-2 border-accent pl-4 italic text-sm text-foreground">
              "{guide.persona.quote}"
            </blockquote>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="mt-10">
        <p className="text-muted-foreground leading-relaxed">{guide.introduction}</p>
      </div>

      {/* Use Cases */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-primary">Use Cases</h2>
        <div className="mt-6 space-y-8">
          {guide.useCases.map((uc, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">{i + 1}</span>
                <h3 className="text-lg font-semibold text-primary">{uc.title}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">The Problem</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{uc.problem}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">The Solution</h4>
                  <p className="mt-1 text-sm text-foreground">{uc.solution}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step by Step</h4>
                  <ol className="mt-2 space-y-1.5">
                    {uc.steps.map((step, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{j + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
                  <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Result</h4>
                  <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">{uc.result}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-primary">Getting Started</h2>
        <ol className="mt-4 space-y-3">
          {guide.gettingStarted.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{i + 1}</span>
              <span className="text-sm text-foreground pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Related Integrations */}
      {guide.relatedIntegrations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-primary">Recommended Integrations</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {guide.relatedIntegrations.map((slug) => (
              <Link
                key={slug}
                href={`/integrations/${slug}`}
                className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:border-accent/50 hover:bg-muted transition-colors"
              >
                {slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {guide.faq.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-primary">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-4">
            {guide.faq.map((f, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">{f.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Guides */}
      {relatedGuides.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-primary">Related Guides</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {relatedGuides.map((rg: any) => (
              <Link
                key={rg.slug}
                href={`/guides/${rg.slug}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-accent/50 transition-colors"
              >
                <span className="text-xl">{rg.icon}</span>
                <span className="text-sm font-semibold text-primary">{rg.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-16 rounded-2xl bg-accent/5 border border-accent/20 p-8 text-center">
        <h2 className="text-xl font-bold text-primary">Ready to get started?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign up for free and get 50 credits. No subscription, no credit card.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link href="/register" className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
            Get Started Free
          </Link>
          <Link href="/tools" className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Browse Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
