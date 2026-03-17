import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { INTEGRATIONS, getIntegrationBySlug, INTEGRATION_CATEGORIES } from '@/data/integrations';

export async function generateStaticParams() {
  return INTEGRATIONS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const integration = getIntegrationBySlug(slug);
  if (!integration) return { title: 'Integration Not Found' };

  return {
    title: `${integration.name} Integration — AI-Powered ${integration.name} Automation | Sotally`,
    description: integration.description,
    openGraph: {
      title: `${integration.name} + Sotally — AI Automation`,
      description: integration.description,
      url: `https://sotally.com/integrations/${slug}`,
    },
  };
}

export default async function IntegrationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const integration = getIntegrationBySlug(slug);
  if (!integration) notFound();

  const categoryInfo = INTEGRATION_CATEGORIES.find(c => c.id === integration.category);
  const relatedIntegrations = INTEGRATIONS
    .filter(i => i.category === integration.category && i.slug !== slug)
    .slice(0, 6);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: integration.faq.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `Sotally ${integration.name} Integration`,
    applicationCategory: 'BusinessApplication',
    description: integration.description,
    url: `https://sotally.com/integrations/${slug}`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    operatingSystem: 'Web',
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/integrations" className="hover:text-accent">Integrations</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{integration.name}</span>
      </nav>

      {/* Hero */}
      <div className="flex items-start gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted text-3xl">
          {integration.icon}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">{integration.name} + Sotally</h1>
            {integration.status === 'active' ? (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Coming Soon</span>
            )}
            {categoryInfo && (
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {categoryInfo.icon} {categoryInfo.name}
              </span>
            )}
          </div>
          <p className="mt-3 text-lg text-muted-foreground leading-relaxed">{integration.longDescription}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-wrap gap-3">
        {integration.status === 'active' ? (
          <>
            <Link href="/dashboard/settings" className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
              Connect {integration.name}
            </Link>
            <Link href={`/tools?q=${encodeURIComponent(integration.name)}`} className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Browse {integration.name} Tools
            </Link>
          </>
        ) : (
          <>
            <Link href="/register" className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
              Sign Up to Get Notified
            </Link>
            <Link href="/bounties" className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Request This Integration
            </Link>
          </>
        )}
      </div>

      {/* Available Actions */}
      {integration.actions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-primary">Available Actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {integration.actions.map((action) => (
              <div key={action.id} className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">{action.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-primary">How It Works</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { step: '1', title: 'Connect', desc: `Add your ${integration.name} ${integration.authLabel || 'credentials'} in Settings` },
            { step: '2', title: 'Choose or Build', desc: `Pick a ${integration.name} tool from the marketplace, or build your own` },
            { step: '3', title: 'Run with AI', desc: `AI processes your input and ${integration.name} executes the action` },
          ].map((s) => (
            <div key={s.step} className="rounded-lg border border-border bg-card p-5 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg font-bold text-accent">{s.step}</div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      {integration.useCases.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-primary">Use Cases</h2>
          <div className="mt-4 space-y-4">
            {integration.useCases.map((uc, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">{uc.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {integration.faq.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-primary">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-4">
            {integration.faq.map((f, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">{f.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Integrations */}
      {relatedIntegrations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-primary">Related Integrations</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedIntegrations.map((ri) => (
              <Link
                key={ri.slug}
                href={`/integrations/${ri.slug}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-accent/50 transition-colors"
              >
                <span className="text-xl">{ri.icon}</span>
                <div>
                  <span className="text-sm font-semibold text-primary">{ri.name}</span>
                  {ri.status === 'active' && (
                    <span className="ml-2 text-[10px] text-emerald-600 font-semibold">Active</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-16 rounded-2xl bg-accent/5 border border-accent/20 p-8 text-center">
        <h2 className="text-xl font-bold text-primary">Ready to automate {integration.name} with AI?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Join Sotally and get 50 free credits. No subscription needed.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link href="/register" className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
            Get Started Free
          </Link>
          <Link href="/tools" className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Browse All Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
