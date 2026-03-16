import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About — Sotally',
  description: 'Sotally is your software ally. We believe software should work like a utility — pay for what you use, not monthly subscriptions.',
};

const howItWorks = [
  {
    title: 'Use Tools',
    description:
      'Browse 1000+ software tools and run them instantly. Pay only for what you use with credits. No subscriptions, no sign-up fatigue.',
    icon: (
      <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008V17.25zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: 'Create Tools',
    description:
      'Build and publish your own tools using our prompt-based builder. No coding required. Set your own pricing and reach thousands of users.',
    icon: (
      <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.59-3.18a1.5 1.5 0 010-2.64l5.59-3.18a1.5 1.5 0 011.56 0l5.59 3.18a1.5 1.5 0 010 2.64l-5.59 3.18a1.5 1.5 0 01-1.56 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.83 12L2.14 14.39a1.5 1.5 0 000 2.64l5.59 3.18a1.5 1.5 0 001.56 0l5.59-3.18a1.5 1.5 0 000-2.64L11.42 12" />
      </svg>
    ),
  },
  {
    title: 'Earn Money',
    description:
      'Earn 65-80% of every credit spent on your tools. Convert earnings to real money via Stripe. Build a passive income from software you create.',
    icon: (
      <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const stats = [
  { label: 'Tools Available', value: '1,200+' },
  { label: 'Active Creators', value: '350+' },
  { label: 'Tool Runs', value: '2.4M+' },
  { label: 'Credits Never Expire', value: 'Forever' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-background px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Your Software Ally
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              We believe software should work like a utility — pay for what you use, not monthly
              subscriptions. Sotally is a credit-based marketplace where you access thousands of tools
              without committing to a single subscription.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-foreground">How It Works</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {howItWorks.map((item) => (
                <div key={item.title} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    {item.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team / Founder */}
        <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground">Built by Makers</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Sotally was created by people who were tired of paying $300/month across a dozen SaaS
              tools they barely used. We built the platform we wished existed — one where you pay for
              what you actually use, and where creators get fairly compensated for the tools they build.
            </p>
            <div className="mt-8 inline-flex items-center gap-4 rounded-xl border border-border bg-card p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                S
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Founder</p>
                <p className="text-sm text-muted-foreground">Building the future of software access</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Join the software revolution
            </h2>
            <p className="mt-2 text-muted-foreground">
              Stop paying for software you barely use. Start paying for what you actually need.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className={buttonVariants({ variant: 'accent', size: 'lg' })}
              >
                Get Started Free
              </Link>
              <Link
                href="/tools"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                Browse Tools
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
