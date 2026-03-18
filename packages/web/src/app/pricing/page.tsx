import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Pricing — Sotally',
  description: 'Simple, transparent pricing for creators. Build and sell apps with Sotally. Free to start, upgrade when you grow.',
};

const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    features: [
      '3 apps',
      '20 generations/month',
      '100 end users/month',
      'Basic analytics',
      'Sotally branding',
      '20% transaction fee',
    ],
    cta: 'Get Started',
    href: '/register',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    description: 'For growing creators',
    features: [
      '25 apps',
      '200 generations/month',
      '10,000 end users/month',
      'Custom domain',
      'Remove Sotally badge',
      '15% transaction fee',
    ],
    cta: 'Upgrade to Pro',
    href: '/dashboard?subscribe=pro',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 49,
    description: 'For professionals and teams',
    features: [
      'Unlimited apps',
      'Unlimited generations',
      'Unlimited end users',
      'Custom domain',
      'Remove Sotally badge',
      '12% transaction fee',
      'API access',
    ],
    cta: 'Upgrade to Business',
    href: '/dashboard?subscribe=business',
    popular: false,
  },
];

const faqs = [
  {
    question: 'Can I start for free?',
    answer: 'Yes. The free tier lets you build up to 3 apps with 20 generations per month. No credit card required.',
  },
  {
    question: 'What counts as a generation?',
    answer: 'Every time you create or iterate on an app using AI, that counts as one generation. Viewing and sharing published apps does not use generations.',
  },
  {
    question: 'Can I earn money selling apps?',
    answer: 'Yes! Set a price on your apps and earn revenue from every purchase. Connect Stripe to receive payouts directly to your bank.',
  },
  {
    question: 'What is the transaction fee?',
    answer: 'When users purchase your paid apps, Sotally takes a percentage of the sale. The fee decreases with higher plans: 20% on Free, 15% on Pro, and 12% on Business.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, there are no long-term contracts. Cancel your subscription at any time and keep access until the end of your billing period.',
  },
  {
    question: 'What happens to my apps if I downgrade?',
    answer: 'Your existing apps remain published. You just cannot create new ones beyond the lower plan limit or use features exclusive to the higher tier.',
  },
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
              Build. Publish. Earn.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Upgrade when your apps take off. No credit card needed to get started.
            </p>
          </div>
        </section>

        {/* Tier Cards */}
        <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier) => (
              <Card
                key={tier.id}
                className={`relative flex flex-col ${
                  tier.popular ? 'border-accent ring-2 ring-accent/20' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="accent">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <div className="mt-2">
                    {tier.price === 0 ? (
                      <span className="text-4xl font-bold text-foreground">Free</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-foreground">${tier.price}</span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="justify-center">
                  <Link
                    href={tier.href}
                    className={buttonVariants({
                      variant: tier.popular ? 'accent' : 'outline',
                      className: 'w-full',
                    })}
                  >
                    {tier.cta}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-muted-foreground">
            Need a custom plan? <strong>Enterprise</strong> packages with dedicated support, custom fees,
            and team management are available.{' '}
            <a href="mailto:sales@sotally.com" className="text-accent hover:underline">
              Contact sales
            </a>
          </p>
        </section>

        {/* FAQ */}
        <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
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
        <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold text-foreground">Ready to build?</h2>
            <p className="mt-2 text-muted-foreground">
              Sign up free and create your first app in minutes.
            </p>
            <div className="mt-6">
              <Link
                href="/register"
                className={buttonVariants({ variant: 'accent', size: 'lg' })}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
