import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Pricing — Sotally',
  description: 'Simple, transparent pricing. Buy credits and use them across 1000+ software tools. No subscriptions required.',
};

const creditPackages = [
  {
    id: 'starter',
    name: 'Starter',
    price: 10,
    credits: 100,
    bonus: null,
    description: 'Perfect for trying out the platform',
    popular: false,
  },
  {
    id: 'popular',
    name: 'Popular',
    price: 25,
    credits: 275,
    bonus: '+10%',
    description: 'Best value for regular users',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 50,
    credits: 600,
    bonus: '+20%',
    description: 'For power users and professionals',
    popular: false,
  },
  {
    id: 'business',
    name: 'Business',
    price: 100,
    credits: 1300,
    bonus: '+30%',
    description: 'Heavy usage and team accounts',
    popular: false,
  },
];

const features = [
  { feature: 'Access to all tools', included: true },
  { feature: 'Credits never expire', included: true },
  { feature: 'Bring Your Own Model (BYOM)', included: true },
  { feature: 'API access', included: true },
  { feature: 'Execution history (90 days)', included: true },
  { feature: 'Bookmark & subscribe to tools', included: true },
  { feature: 'Creator dashboard', included: true },
  { feature: 'Priority support', included: false, note: 'Business only' },
];

const faqs = [
  {
    question: 'Do credits expire?',
    answer: 'No. Once you purchase credits, they stay in your account forever. Use them whenever you need.',
  },
  {
    question: 'What if a tool fails or produces no output?',
    answer: 'You get a full credit refund automatically. We only charge for successful executions.',
  },
  {
    question: 'Can I earn money on Sotally?',
    answer: 'Yes! Become a creator and publish your own tools. You earn 65-80% of the credits spent on your tools, which you can convert to real money via Stripe.',
  },
  {
    question: 'Can I get a refund on purchased credits?',
    answer: 'Yes, unused credits can be refunded within 30 days of purchase. After 30 days, credits are non-refundable but they never expire, so you can use them anytime.',
  },
  {
    question: 'Is there a free tier?',
    answer: 'Every new account gets 50 free credits on signup — enough to try 5-10 tools and see if Sotally is right for you.',
  },
  {
    question: 'What is BYOM?',
    answer: 'Bring Your Own Model lets you connect your own AI provider API keys (OpenAI, Anthropic, etc.). When you use BYOM, tool executions cost fewer credits because the AI cost is on your own key.',
  },
];

const competitors = [
  { name: 'Sotally', price: 'From $5 (100 credits)', model: 'Pay per use', tools: '56+ tools', lock: 'No lock-in', highlight: true },
  { name: 'ChatGPT Plus', price: '$20/month', model: 'Monthly subscription', tools: '1 chatbot', lock: 'Locked in', highlight: false },
  { name: 'Jasper', price: '$49/month', model: 'Monthly subscription', tools: 'Writing only', lock: 'Annual contract', highlight: false },
  { name: 'Copy.ai', price: '$49/month', model: 'Monthly subscription', tools: 'Marketing only', lock: 'Locked in', highlight: false },
];

export default function PricingPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Pay for what you use. Nothing more.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              No subscriptions. No monthly fees. Buy credits once, use them across 56+ AI tools. Credits never expire.
            </p>
            <div className="mt-6 inline-flex items-center rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
              50 free credits on signup — no credit card needed
            </div>
          </div>
        </section>

        {/* Credit Packages */}
        <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {creditPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative flex flex-col ${
                  pkg.popular ? 'border-accent ring-2 ring-accent/20' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="accent">Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-foreground">${pkg.price}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 text-center">
                  <p className="text-2xl font-semibold text-primary">
                    {pkg.credits.toLocaleString()} credits
                  </p>
                  {pkg.bonus && (
                    <p className="mt-1 text-sm font-medium text-accent">{pkg.bonus} bonus</p>
                  )}
                  <p className="mt-3 text-sm text-muted-foreground">{pkg.description}</p>
                </CardContent>
                <CardFooter className="justify-center">
                  <Button
                    variant={pkg.popular ? 'accent' : 'outline'}
                    className="w-full"
                  >
                    Buy {pkg.name}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-muted-foreground">
            Need more? <strong>Enterprise</strong> packages with custom pricing, 35%+ bonus, invoicing,
            and team management are available.{' '}
            <a href="mailto:sales@sotally.com" className="text-accent hover:underline">
              Contact sales
            </a>
          </p>
        </section>

        {/* Feature Comparison */}
        <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center text-2xl font-bold text-foreground">
              What you get with every package
            </h2>
            <div className="mt-8 space-y-3">
              {features.map((item) => (
                <div
                  key={item.feature}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                >
                  <span className="text-sm text-foreground">{item.feature}</span>
                  {item.included ? (
                    <svg
                      className="h-5 w-5 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs text-muted-foreground">{item.note}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Competitor Comparison */}
        <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-foreground">
              How Sotally compares
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Stop paying monthly for tools you use occasionally.
            </p>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-semibold text-foreground">Platform</th>
                    <th className="pb-3 text-left font-semibold text-foreground">Price</th>
                    <th className="pb-3 text-left font-semibold text-foreground">Model</th>
                    <th className="pb-3 text-left font-semibold text-foreground">Tools</th>
                    <th className="pb-3 text-left font-semibold text-foreground">Lock-in</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c) => (
                    <tr key={c.name} className={`border-b border-border ${c.highlight ? 'bg-accent/5' : ''}`}>
                      <td className={`py-3 font-medium ${c.highlight ? 'text-accent' : 'text-foreground'}`}>
                        {c.name} {c.highlight && <span className="ml-1 text-[10px] rounded-full bg-accent/10 px-1.5 py-0.5">You are here</span>}
                      </td>
                      <td className="py-3 text-muted-foreground">{c.price}</td>
                      <td className="py-3 text-muted-foreground">{c.model}</td>
                      <td className="py-3 text-muted-foreground">{c.tools}</td>
                      <td className={`py-3 ${c.highlight ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>{c.lock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              A user running 10 tools/day at 5 credits each spends ~$4.50/month on Sotally vs $20-49/month on subscription platforms.
            </p>
          </div>
        </section>

        {/* How Credits Work */}
        <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground">How credits work</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-2xl font-bold text-accent">1 credit</div>
                <div className="mt-1 text-sm text-muted-foreground">≈ $0.03-$0.05</div>
                <p className="mt-2 text-xs text-muted-foreground">Depending on package</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-2xl font-bold text-accent">3-10 credits</div>
                <div className="mt-1 text-sm text-muted-foreground">= typical tool run</div>
                <p className="mt-2 text-xs text-muted-foreground">Most tools cost 3-10 credits</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-2xl font-bold text-accent">50 free</div>
                <div className="mt-1 text-sm text-muted-foreground">on signup</div>
                <p className="mt-2 text-xs text-muted-foreground">Try 5-15 tools free</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center text-2xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
            <div className="mt-8 space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-sm font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold text-foreground">Ready to get started?</h2>
            <p className="mt-2 text-muted-foreground">
              Sign up free and get 50 credits to explore the platform.
            </p>
            <div className="mt-6">
              <Link
                href="/register"
                className={buttonVariants({ variant: 'accent', size: 'lg' })}
              >
                Get Started Free — 50 Credits
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
