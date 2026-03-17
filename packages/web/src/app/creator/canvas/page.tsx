'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface GeneratedTool {
  name: string;
  slug: string;
  description: string;
  inputSchema: Record<string, unknown>;
  config: Record<string, unknown>;
  suggestedCategory: string;
  suggestedPrice: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  'ai-writing': 'AI Writing',
  marketing: 'Marketing',
  'data-tools': 'Data Tools',
  productivity: 'Productivity',
  development: 'Development',
  business: 'Business',
};

export default function CanvasPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedTool | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!token || description.trim().length < 10) return;

    setGenerating(true);
    setError(null);
    setGenerated(null);

    try {
      const res = (await api.creator.canvasGenerate(token, description)) as {
        success: boolean;
        data: GeneratedTool;
        error?: { message: string };
      };
      if (res.success) {
        setGenerated(res.data);
      } else {
        setError(res.error?.message || 'Failed to generate tool');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tool');
    } finally {
      setGenerating(false);
    }
  }

  function handleEditAndPublish() {
    if (!generated) return;

    // Store generated data in sessionStorage for the tool creation form to pick up
    sessionStorage.setItem(
      'canvas_generated_tool',
      JSON.stringify(generated),
    );
    router.push('/creator/tools/new?from=canvas');
  }

  function handleRegenerate() {
    setGenerated(null);
    handleGenerate();
  }

  const inputProperties = generated?.inputSchema
    ? (generated.inputSchema as { properties?: Record<string, { type?: string; title?: string; description?: string }> }).properties || {}
    : {};

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Sotally Canvas</h1>
        <p className="mt-1 text-muted-foreground">
          Describe what your tool should do and let AI generate the configuration for you.
        </p>
      </div>

      {/* Input Section */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <label
            htmlFor="tool-description"
            className="mb-2 block text-sm font-medium text-primary"
          >
            Describe what your tool should do
          </label>
          <textarea
            id="tool-description"
            className="w-full rounded-xl border border-border bg-background p-4 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors resize-none"
            rows={6}
            placeholder="Example: A tool that takes a blog topic and target audience, then generates a complete blog post outline with SEO-optimized headings, key points for each section, and a meta description."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={generating}
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {description.length < 10
                ? `${10 - description.length} more characters needed`
                : 'Ready to generate'}
            </span>
            <Button
              variant="accent"
              onClick={handleGenerate}
              disabled={generating || description.trim().length < 10}
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Tool'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-8 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Preview Section */}
      {generated && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Generated Tool Preview</h2>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRegenerate} disabled={generating}>
                Regenerate
              </Button>
              <Button variant="accent" onClick={handleEditAndPublish}>
                Edit & Publish
              </Button>
            </div>
          </div>

          {/* Tool Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Tool Name
                  </h3>
                  <p className="mt-1 text-lg font-semibold text-primary">{generated.name}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    URL Slug
                  </h3>
                  <p className="mt-1 font-mono text-sm text-foreground">/tools/{generated.slug}</p>
                </div>
                <div className="sm:col-span-2">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Description
                  </h3>
                  <p className="mt-1 text-foreground">{generated.description}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Suggested Category
                  </h3>
                  <p className="mt-1">
                    <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                      {CATEGORY_LABELS[generated.suggestedCategory] || generated.suggestedCategory}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Suggested Price
                  </h3>
                  <p className="mt-1 text-lg font-semibold text-primary">
                    {generated.suggestedPrice} credits
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Schema Preview */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Input Fields
              </h3>
              {Object.keys(inputProperties).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(inputProperties).map(([key, field]) => (
                    <div
                      key={key}
                      className="flex items-start gap-4 rounded-lg border border-border/50 bg-muted/30 p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-xs font-mono text-accent">
                        {field.type === 'string' ? 'Aa' : field.type === 'number' ? '#' : '{}'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary">
                          {field.title || key}
                        </p>
                        {field.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {field.description}
                          </p>
                        )}
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {key}: {field.type || 'string'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No input fields defined.</p>
              )}
            </CardContent>
          </Card>

          {/* Config Preview */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Execution Config
              </h3>
              <pre className="overflow-x-auto rounded-lg bg-muted/50 p-4 text-xs text-foreground">
                {JSON.stringify(generated.config, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Bottom actions */}
          <div className="flex justify-end gap-3 pb-8">
            <Button variant="outline" onClick={handleRegenerate} disabled={generating}>
              Regenerate
            </Button>
            <Button variant="accent" onClick={handleEditAndPublish}>
              Edit & Publish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
