'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface ApplyResult {
  affiliateCode: string;
  trackingUrl: string;
  commissionRate: string;
  tier: string;
}

export default function AffiliateApplyPage() {
  const { token, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleApply() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = (await api.affiliates.apply(token)) as {
        success: boolean;
        data: ApplyResult;
      };
      if (res.success) {
        setResult(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-primary">Affiliate Program</h1>
        <p className="mt-2 text-muted-foreground">Please log in to apply for the affiliate program.</p>
        <Link href="/login">
          <Button variant="accent" className="mt-6">Log In</Button>
        </Link>
      </div>
    );
  }

  // Success state
  if (result) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-3xl">
            &#10003;
          </div>
          <h1 className="text-3xl font-bold text-primary">Welcome to the Affiliate Program!</h1>
          <p className="mt-2 text-muted-foreground">
            Your application has been approved. Start sharing your link to earn commissions.
          </p>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Tracking Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-border bg-muted/50 px-4 py-3 font-mono text-sm text-foreground">
                {result.trackingUrl}
              </div>
              <Button variant="accent" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Affiliate Code</p>
                <p className="font-mono font-medium text-foreground">{result.affiliateCode}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Commission Rate</p>
                <p className="font-medium text-foreground">
                  {(parseFloat(result.commissionRate) * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Tier</p>
                <p className="font-medium capitalize text-foreground">{result.tier}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Commission Type</p>
                <p className="font-medium text-foreground">Lifetime recurring</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/affiliate">
            <Button variant="accent">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Sotally Affiliate Program</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Earn 10% lifetime commission on every credit purchase made by users you refer.
        </p>
      </div>

      {/* Benefits */}
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl font-bold text-accent">
              10%
            </div>
            <h3 className="font-semibold text-foreground">Lifetime Commission</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Earn 10% on every purchase your referrals make, forever.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl font-bold text-accent">
              30d
            </div>
            <h3 className="font-semibold text-foreground">30-Day Cookie</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your referral link tracks visitors for 30 days after they click.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl font-bold text-accent">
              $25
            </div>
            <h3 className="font-semibold text-foreground">Low Payout Minimum</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Request payouts once you reach $25 in earnings.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                1
              </span>
              <div>
                <p className="font-medium text-foreground">Apply and get your unique link</p>
                <p className="text-sm text-muted-foreground">
                  Click the button below to instantly get your personal tracking link.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                2
              </span>
              <div>
                <p className="font-medium text-foreground">Share with your audience</p>
                <p className="text-sm text-muted-foreground">
                  Share your link on social media, blog posts, videos, or anywhere your audience is.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                3
              </span>
              <div>
                <p className="font-medium text-foreground">Earn on every purchase</p>
                <p className="text-sm text-muted-foreground">
                  When someone signs up through your link and buys credits, you earn 10% commission on that purchase -- and every future purchase they make.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="mt-10 text-center">
        {error && (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        )}
        <Button
          variant="accent"
          size="lg"
          onClick={handleApply}
          disabled={loading}
        >
          {loading ? 'Applying...' : 'Apply Now'}
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          No approval wait. Get your link instantly.
        </p>
      </div>
    </div>
  );
}
