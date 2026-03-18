'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthHydrated } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { NICHES } from '@sotally/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface Template {
  id: string;
  app_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  niche: string | null;
  price_cents: number;
  use_count: number;
  created_at: string;
  creator_name: string | null;
  creator_avatar_url: string | null;
}

const NICHE_OPTIONS = [
  { value: '', label: 'All Niches' },
  ...NICHES.map((n) => ({ value: n.slug, label: n.shortName })),
];

export default function TemplatesPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const _hasHydrated = useAuthHydrated();
  const { addToast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [selectedNiche]);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedNiche) params.set('niche', selectedNiche);
      params.set('limit', '50');

      const res = await fetch(`${API_URL}/templates?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }

  async function handleUseTemplate(templateId: string) {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !token) {
      router.push('/login?redirect=/templates');
      return;
    }

    setUsingTemplate(templateId);
    try {
      const res = await fetch(`${API_URL}/templates/${templateId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        addToast('App created from template! Redirecting to studio...', 'success');
        router.push(`/studio/${data.data.appId}`);
      } else {
        const errData = await res.json().catch(() => null);
        addToast(errData?.error?.message || 'Failed to use template', 'error');
      }
    } catch {
      addToast('Failed to use template', 'error');
    } finally {
      setUsingTemplate(null);
    }
  }

  function formatPrice(cents: number): string {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start from a proven prompt chain. Clone any template and customize it for your needs.
          </p>
        </div>
      </div>

      {/* Niche Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {NICHE_OPTIONS.map((niche) => (
          <button
            key={niche.value}
            onClick={() => setSelectedNiche(niche.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedNiche === niche.value
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {niche.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm animate-pulse">
                <div className="space-y-3">
                  <div className="h-5 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="group transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-primary group-hover:text-accent transition-colors line-clamp-1">
                      {template.title}
                    </h3>
                    <Badge
                      variant={template.price_cents === 0 ? 'default' : 'outline'}
                      className={
                        template.price_cents === 0
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 shrink-0'
                          : 'shrink-0'
                      }
                    >
                      {formatPrice(template.price_cents)}
                    </Badge>
                  </div>

                  {template.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {template.niche && (
                      <Badge variant="muted" className="text-xs">
                        {template.niche}
                      </Badge>
                    )}
                    <span>{template.use_count.toLocaleString()} uses</span>
                  </div>

                  {template.creator_name && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      by {template.creator_name}
                    </p>
                  )}

                  <div className="mt-4">
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleUseTemplate(template.id)}
                      disabled={usingTemplate === template.id}
                    >
                      {usingTemplate === template.id ? 'Creating...' : 'Use This Template'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-primary">No templates yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedNiche
                ? 'No templates found for this niche. Try a different filter.'
                : 'Templates will appear here once creators start sharing their app blueprints.'}
            </p>
            <Link
              href="/create"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Create Your Own App
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
