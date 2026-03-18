'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import { Header } from '@/components/layout/header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

const NICHES = [
  { value: '', label: 'Select a niche (optional)' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'language', label: 'Language' },
  { value: 'business', label: 'Business' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'content', label: 'Content' },
  { value: 'design', label: 'Design' },
];

export default function CreatePage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const { addToast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [niche, setNiche] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login?redirect=/create');
    }
  }, [isAuthenticated, token, router]);

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
      const appId = data.data?.id || data.id;
      router.push(`/studio/${appId}`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to generate app', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

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
                  {NICHES.map((n) => (
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
