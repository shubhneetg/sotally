'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface ToolData {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string | null;
  categoryId: string | null;
  executionType: string;
  pricing: any;
  inputSchema: any;
  outputSchema: any;
  config: any;
  iconUrl: string | null;
  tags: string[] | null;
  status: string;
  demoOutput: any;
  seoTitle: string | null;
  seoDescription: string | null;
}

export default function EditToolPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const toolId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [tags, setTags] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPromptTemplate, setUserPromptTemplate] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [pricingModel, setPricingModel] = useState('per_run');
  const [creditsPerRun, setCreditsPerRun] = useState(5);
  const [status, setStatus] = useState('draft');

  useEffect(() => {
    if (!token || !toolId) return;

    async function load() {
      try {
        // We reuse the tools list endpoint and find by ID, or fetch via the update endpoint
        // For now, list all and find the tool
        const res = (await api.creator.listTools(token!, { page: 1 })) as {
          success: boolean;
          data: { items: any[] };
        };

        if (!res.success) {
          setError('Failed to load tool');
          return;
        }

        const tool = res.data.items.find((t: any) => t.id === toolId);
        if (!tool) {
          setError('Tool not found');
          return;
        }

        setName(tool.name || '');
        setSlug(tool.slug || '');
        setDescription(tool.description || '');
        setLongDescription(tool.longDescription || '');
        setTags((tool.tags || []).join(', '));
        setStatus(tool.status || 'draft');

        // Config
        const config = tool.config || {};
        setSystemPrompt(config.systemPrompt || '');
        setUserPromptTemplate(config.userPromptTemplate || '');
        setModel(config.model || 'gpt-4o-mini');
        setTemperature(config.temperature ?? 0.7);
        setMaxTokens(config.maxTokens ?? 1000);

        // Pricing
        const pricing = tool.pricing || {};
        setPricingModel(pricing.model || 'per_run');
        setCreditsPerRun(pricing.creditsPerRun || 5);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tool');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, toolId]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const tagsList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);

      let pricing: Record<string, unknown>;
      if (pricingModel === 'free') {
        pricing = { model: 'free' };
      } else {
        pricing = { model: 'per_run', creditsPerRun };
      }

      const config = {
        systemPrompt,
        userPromptTemplate,
        model,
        temperature,
        maxTokens,
      };

      await api.creator.updateTool(token, toolId, {
        name,
        slug,
        description,
        longDescription: longDescription || undefined,
        tags: tagsList,
        pricing,
        config,
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);

    try {
      await api.creator.publishTool(token, toolId);
      setStatus('published');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish tool');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Edit Tool</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant={
                status === 'published' ? 'default' : status === 'draft' ? 'muted' : 'destructive'
              }
            >
              {status}
            </Badge>
            {status === 'published' && (
              <Link
                href={`/tools/${slug}`}
                className="text-sm text-accent hover:text-accent/80"
              >
                View live page
              </Link>
            )}
          </div>
        </div>
        <Link href="/creator/tools">
          <Button variant="outline">Back to Tools</Button>
        </Link>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-accent/50 bg-accent/10 px-4 py-3 text-sm text-accent">
          Changes saved successfully.
        </div>
      )}

      {/* Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tool Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Slug</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Short Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="flex w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Long Description
            </label>
            <textarea
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              rows={5}
              maxLength={5000}
              className="flex w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tags</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2, tag3" />
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={5}
              className="flex w-full rounded-lg border border-border bg-card px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              User Prompt Template
            </label>
            <textarea
              value={userPromptTemplate}
              onChange={(e) => setUserPromptTemplate(e.target.value)}
              rows={5}
              className="flex w-full rounded-lg border border-border bg-card px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Temperature: {temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="mt-2 w-full accent-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Max Tokens</label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)}
                min={100}
                max={16000}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {['free', 'per_run'].map((pm) => (
              <button
                key={pm}
                type="button"
                onClick={() => setPricingModel(pm)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                  pricingModel === pm
                    ? 'border-accent bg-accent/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-accent/50'
                }`}
              >
                {pm === 'free' ? 'Free' : 'Per Run'}
              </button>
            ))}
          </div>
          {pricingModel === 'per_run' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Credits Per Run
              </label>
              <Input
                type="number"
                value={creditsPerRun}
                onChange={(e) => setCreditsPerRun(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={1000}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="accent" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {status === 'draft' && (
          <Button variant="default" onClick={handlePublish} disabled={saving}>
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}
