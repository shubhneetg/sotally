'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

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

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuthStore();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);

  // Step 1 state
  const [slug, setSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Step 2 state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [niche, setNiche] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login?redirect=/onboarding');
    }
  }, [isAuthenticated, token, router]);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user]);

  // Slug validation
  const validateSlug = useCallback((value: string): string | null => {
    if (value.length < 3) return 'Must be at least 3 characters';
    if (value.length > 30) return 'Must be 30 characters or less';
    if (value.startsWith('-') || value.endsWith('-')) return 'Cannot start or end with a hyphen';
    if (!SLUG_REGEX.test(value)) return 'Only lowercase letters, numbers, and hyphens';
    return null;
  }, []);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      setSlugError(null);
      return;
    }

    const error = validateSlug(slug);
    if (error) {
      setSlugError(error);
      setSlugAvailable(null);
      return;
    }

    setSlugError(null);
    setSlugChecking(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/creator/check-slug?slug=${encodeURIComponent(slug)}`
        );
        const data = await res.json();
        setSlugAvailable(data.data?.available ?? data.available ?? false);
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, validateSlug]);

  const handleSlugChange = (value: string) => {
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !slug || !slugAvailable) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/creator/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug,
          displayName: displayName.trim() || undefined,
          bio: bio.trim() || undefined,
          niche: niche || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: { message: 'Setup failed' } }));
        throw new Error(errData.error?.message || 'Failed to set up storefront');
      }

      addToast('Welcome! Your storefront is ready.', 'success');
      router.push('/create');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Setup failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Set up your storefront</h1>
          <p className="mt-2 text-muted-foreground">
            Claim your subdomain and start publishing apps.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
              step >= 1 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {step > 1 ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <div className={cn('h-0.5 w-12', step > 1 ? 'bg-accent' : 'bg-muted')} />
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
              step >= 2 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            2
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          {step === 1 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-primary">Choose your subdomain</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This will be your storefront URL where people find your apps.
              </p>

              <div className="mt-6">
                <div className="flex items-center rounded-xl border border-border bg-background focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="your-name"
                    maxLength={30}
                    className="flex-1 rounded-l-xl border-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <span className="shrink-0 rounded-r-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                    .sotally.com
                  </span>
                </div>

                {/* Slug feedback */}
                <div className="mt-2 h-5">
                  {slugChecking && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking availability...
                    </span>
                  )}
                  {slugError && (
                    <span className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {slugError}
                    </span>
                  )}
                  {!slugChecking && !slugError && slugAvailable === true && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <Check className="h-3 w-3" />
                      {slug}.sotally.com is available!
                    </span>
                  )}
                  {!slugChecking && !slugError && slugAvailable === false && (
                    <span className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      This subdomain is taken.
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!slugAvailable || !!slugError}
                className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-primary">Set up your profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell visitors a bit about yourself.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
                    Display name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-foreground">
                    Bio{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                    placeholder="Tell people what you do..."
                  />
                  <p className="mt-1 text-xs text-muted-foreground text-right">
                    {bio.length}/500
                  </p>
                </div>

                <div>
                  <label htmlFor="niche" className="block text-sm font-medium text-foreground">
                    Niche{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <div className="relative mt-1.5">
                    <select
                      id="niche"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Launch Storefront'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
