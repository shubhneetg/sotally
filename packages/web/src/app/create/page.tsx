'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ChevronDown, Shuffle } from 'lucide-react';
import { useAuthStore, useAuthHydrated } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import { Header } from '@/components/layout/header';
import { NICHES } from '@sotally/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

const NICHE_OPTIONS = [
  { value: '', label: 'Select a niche (optional)' },
  ...NICHES.map((n) => ({ value: n.slug, label: n.shortName })),
];

export default function CreatePage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const _hasHydrated = useAuthHydrated();
  const { addToast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [niche, setNiche] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inspirationSeed, setInspirationSeed] = useState(0);

  useEffect(() => {
    if (_hasHydrated && (!isAuthenticated || !token)) {
      router.push('/login?redirect=/create');
    }
  }, [_hasHydrated, isAuthenticated, token, router]);

  // Pick 6 example prompts (one per niche, rotated by seed)
  const inspirationPrompts = useMemo(() => {
    const shuffled = [...NICHES].sort(
      () => Math.sin(inspirationSeed * 9301 + NICHES.length) - 0.5
    );
    return shuffled.slice(0, 6).map((n) => ({
      niche: n,
      prompt: n.examplePrompts[inspirationSeed % n.examplePrompts.length],
    }));
  }, [inspirationSeed]);

  const handleSurpriseMe = () => {
    const allPrompts = NICHES.flatMap((n) =>
      n.examplePrompts.map((p) => ({ prompt: p, nicheSlug: n.slug }))
    );
    const pick = allPrompts[Math.floor(Math.random() * allPrompts.length)];
    setPrompt(pick.prompt);
    setNiche(pick.nicheSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      addToast('Please describe the app you want to create', 'error');
      return;
    }
    if (!token) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/apps/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          ...(niche && { niche }),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: { message: 'Generation failed' } }));
        throw new Error(errData.error?.message || 'Failed to generate app');
      }

      const data = await res.json();
      const appId = data.data?.appId || data.data?.id || data.id;
      router.push(`/studio/${appId}`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to generate app', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!_hasHydrated || !isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-3xl font-bold text-primary">Create a new app</h1>
            <p className="mt-2 text-muted-foreground">
              Describe what you want in plain English. We&apos;ll generate a working React app for you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-foreground"
              >
                What should your app do?
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the app you want to create... e.g., 'A calorie tracker where users can log meals, see daily totals, and track weekly trends with charts'"
                rows={6}
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                disabled={submitting}
              />
            </div>

            {/* Prompt Inspiration */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Need inspiration?</span>
                <button
                  type="button"
                  onClick={() => {
                    setInspirationSeed((s) => s + 1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  Shuffle
                </button>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {inspirationPrompts.map(({ niche: n, prompt: p }) => (
                  <button
                    key={`${n.slug}-${p}`}
                    type="button"
                    onClick={() => {
                      setPrompt(p);
                      setNiche(n.slug);
                    }}
                    className="group flex items-start gap-2.5 rounded-lg border border-border bg-card/50 px-3 py-2.5 text-left text-xs transition-all hover:border-accent/50 hover:bg-accent/5"
                  >
                    <span className="shrink-0 text-base leading-none mt-0.5">{n.icon}</span>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                      {p}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={handleSurpriseMe}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Surprise Me
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="niche"
                className="block text-sm font-medium text-foreground"
              >
                Niche
              </label>
              <div className="relative mt-2">
                <select
                  id="niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-card px-4 py-3 pr-10 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  disabled={submitting}
                >
                  {NICHE_OPTIONS.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !prompt.trim()}
              className="w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate App
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
