'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

const roles = [
  { icon: '💻', name: 'Developer', guide: '/guides/development', desc: 'Code reviews, docs, regex' },
  { icon: '📈', name: 'Marketer', guide: '/guides/marketing', desc: 'Campaigns, social, emails' },
  { icon: '✍️', name: 'Writer', guide: '/guides/writing', desc: 'Hooks, newsletters, repurposing' },
  { icon: '📊', name: 'Data Analyst', guide: '/guides/data-analytics', desc: 'Surveys, SQL, dashboards' },
  { icon: '💼', name: 'Business', guide: '/guides/business', desc: 'Plans, OKRs, meetings' },
  { icon: '🎓', name: 'Educator', guide: '/guides/education', desc: 'Lessons, quizzes, study guides' },
  { icon: '🎨', name: 'Designer', guide: '/guides/design', desc: 'Colors, UI copy, fonts' },
  { icon: '⚡', name: 'Ops / PM', guide: '/guides/productivity', desc: 'Standups, workflows, reports' },
];

const starterTools = [
  { slug: 'daily-standup-summary', name: 'Daily Standup Generator', icon: '📋', desc: 'Turn bullet points into a formatted standup update' },
  { slug: 'story-hook-generator', name: 'Story Hook Generator', icon: '✍️', desc: 'Generate 10 compelling hooks for any topic' },
  { slug: 'color-palette-generator', name: 'Color Palette Generator', icon: '🎨', desc: 'Create harmonious color palettes from any base color' },
];

export default function WelcomePage() {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-4">
          🪙 50 free credits in your account
        </div>
        <h1 className="text-3xl font-bold text-primary sm:text-4xl">
          Welcome to Sotally, {firstName}!
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          AI-powered tools for every role. No subscriptions — pay only for what you use.
        </p>
      </div>

      {/* Role Picker */}
      <div className="mt-10">
        <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          What best describes you?
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {roles.map((role) => (
            <Link
              key={role.name}
              href={role.guide}
              className="group flex flex-col items-center rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="text-2xl">{role.icon}</span>
              <span className="mt-2 text-sm font-semibold text-primary group-hover:text-accent transition-colors">{role.name}</span>
              <span className="mt-0.5 text-[10px] text-muted-foreground text-center">{role.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Try These Tools */}
      <div className="mt-12">
        <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Try a popular tool right now
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {starterTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}/run`}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tool.icon}</span>
                <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors">{tool.name}</h3>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{tool.desc}</p>
              <div className="mt-3 inline-flex items-center rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                Try now
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Build Your Own */}
      <div className="mt-12 rounded-2xl bg-gradient-to-br from-accent/5 via-background to-accent/10 border border-accent/20 p-8 text-center">
        <h2 className="text-xl font-bold text-primary">Or build your own tool in 60 seconds</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Describe what your tool should do — AI builds it for you. No coding required.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href="/creator/canvas"
            className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Open AI Canvas
          </Link>
          <Link
            href="/guides/creators"
            className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Creator Guide
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
