'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface Template {
  id: string;
  name: string;
  description: string | null;
  executionType: string;
  defaultConfig: Record<string, unknown> | null;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  createdAt: string;
}

const EXECUTION_TYPE_ICONS: Record<string, string> = {
  prompt: 'AI',
  pipeline: 'PL',
  docker: 'DK',
  external_api: 'AP',
};

const EXECUTION_TYPE_LABELS: Record<string, string> = {
  prompt: 'AI Prompt',
  pipeline: 'Pipeline',
  docker: 'Docker',
  external_api: 'External API',
};

export default function TemplatesPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const res = (await api.creator.templates(token)) as {
          success: boolean;
          data: Template[];
        };
        if (res.success) {
          setTemplates(res.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  function handleUseTemplate(templateId: string) {
    router.push(`/creator/tools/new?template=${templateId}`);
  }

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">Tool Templates</h1>
          <p className="mt-1 text-muted-foreground">
            Start from a template to build your tool faster.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-primary">Tool Templates</h1>
        <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Tool Templates</h1>
        <p className="mt-1 text-muted-foreground">
          Start from a template to build your tool faster. Each template comes with pre-configured inputs and execution steps.
        </p>
      </div>

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="group flex flex-col transition-all hover:shadow-lg hover:border-accent/30"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent">
                    {EXECUTION_TYPE_ICONS[template.executionType] || 'TL'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge variant="muted" className="mt-1 text-xs">
                      {EXECUTION_TYPE_LABELS[template.executionType] || template.executionType}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="line-clamp-3 flex-1 text-sm text-muted-foreground leading-relaxed">
                  {template.description || 'No description available.'}
                </p>
                <Button
                  variant="accent"
                  className="mt-4 w-full"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="mt-4 text-muted-foreground">No templates available yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try the{' '}
            <a href="/creator/canvas" className="text-accent hover:underline">
              AI Canvas
            </a>{' '}
            to generate a tool from a description.
          </p>
        </div>
      )}
    </div>
  );
}
