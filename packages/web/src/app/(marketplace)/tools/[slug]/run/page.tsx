'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { DynamicForm } from '@/components/marketplace/dynamic-form';
import { useToolExecution } from '@/hooks/use-tool-execution';
import { useAuthStore } from '@/stores/auth.store';
import { useCreditStore } from '@/stores/credit.store';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function creditsToDollars(credits: number): string {
  return `$${(credits * 0.03).toFixed(2)}`;
}

interface ToolData {
  name: string;
  slug: string;
  icon: string;
  description: string;
  creditCost: number;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      title?: string;
      description?: string;
      enum?: string[];
      maxLength?: number;
      minimum?: number;
      maximum?: number;
      default?: unknown;
    }>;
    required?: string[];
  };
}

function mapToolDataFromApi(apiTool: any): ToolData {
  return {
    name: apiTool.name,
    slug: apiTool.slug,
    icon: apiTool.iconUrl || apiTool.icon || '🛠️',
    description: apiTool.description,
    creditCost: apiTool.creditCost ?? apiTool.pricing?.creditsPerRun ?? apiTool.pricing?.credits ?? 0,
    inputSchema: apiTool.inputSchema,
  };
}

export default function ToolRunPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { isAuthenticated, token } = useAuthStore();
  const { balance, fetchBalance } = useCreditStore();
  const { execute, isExecuting, result, error, progress, reset } = useToolExecution();
  const { addToast } = useToast();

  const [tool, setTool] = useState<ToolData | null>(null);
  const [toolLoading, setToolLoading] = useState(true);
  const [toolError, setToolError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingInput, setPendingInput] = useState<Record<string, unknown> | null>(null);

  // Fetch tool data from API
  useEffect(() => {
    async function fetchTool() {
      setToolLoading(true);
      setToolError(null);
      try {
        const res = (await api.tools.get(slug)) as {
          success: boolean;
          data: any;
        };
        setTool(mapToolDataFromApi(res.data));
      } catch (err) {
        setToolError(err instanceof Error ? err.message : 'Failed to load tool');
      } finally {
        setToolLoading(false);
      }
    }
    fetchTool();
  }, [slug]);

  // Fetch credit balance when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchBalance(token);
    }
  }, [isAuthenticated, token, fetchBalance]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-primary">Sign in to run tools</h1>
        <p className="mt-2 text-muted-foreground">
          You need an account to run tools and manage credits.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={`/login?redirect=/tools/${slug}/run`}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 shadow-sm transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  if (toolLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Loading tool...</p>
      </div>
    );
  }

  if (toolError || !tool) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-primary">Tool not found</h1>
        <p className="mt-2 text-muted-foreground">{toolError || 'This tool could not be loaded.'}</p>
        <Link href="/tools" className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent/80">
          Back to marketplace
        </Link>
      </div>
    );
  }

  const handleFormSubmit = (data: Record<string, unknown>) => {
    setPendingInput(data);
    setShowConfirm(true);
  };

  const handleConfirmRun = () => {
    if (pendingInput) {
      setShowConfirm(false);
      execute(tool.slug, pendingInput);
    }
  };

  const handleRunAgain = () => {
    reset();
    setPendingInput(null);
    setShowConfirm(false);
  };

  const handleCopyResult = () => {
    if (result?.output) {
      const text = typeof result.output === 'string'
        ? result.output
        : JSON.stringify(result.output, null, 2);
      navigator.clipboard.writeText(text);
      addToast('Result copied to clipboard', 'success');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tools/${slug}`;
    navigator.clipboard.writeText(url);
    addToast('Link copied to clipboard', 'success');
  };

  const handleShareTwitter = () => {
    if (!tool) return;
    const text = encodeURIComponent(`I just used ${tool.name} on @sotally! \uD83D\uDE80`);
    const url = encodeURIComponent(`${window.location.origin}/tools/${slug}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(`${window.location.origin}/tools/${slug}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const insufficientCredits = balance < tool.creditCost;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Tool Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-2xl">
          {tool.icon}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">{tool.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
        </div>
        <span className="inline-flex items-center rounded-md bg-accent/10 px-2.5 py-1 text-sm font-semibold text-accent">
          🪙 {tool.creditCost} (~{creditsToDollars(tool.creditCost)})
        </span>
      </div>

      {/* Execution Result */}
      {result && (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary">Result</h2>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
              result.status === 'completed'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-destructive/10 text-destructive'
            }`}>
              {result.status}
            </span>
          </div>
          <div className="mt-4 rounded-lg bg-muted/50 p-4 prose prose-sm prose-neutral dark:prose-invert max-w-none [&_pre]:bg-background/50 [&_pre]:rounded-md [&_pre]:p-3 [&_code]:text-xs [&_table]:text-sm [&_th]:px-3 [&_th]:py-1.5 [&_td]:px-3 [&_td]:py-1.5 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_p]:my-1.5 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold">
            {typeof result.output === 'string' ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.output}
              </ReactMarkdown>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleCopyResult}>
              Copy Result
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRunAgain}>
              Run Again
            </Button>
          </div>
          {result.status === 'completed' && (
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Share:</span>
              <button
                onClick={handleCopyLink}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={handleShareTwitter}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Twitter
              </button>
              <button
                onClick={handleShareLinkedIn}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                LinkedIn
              </button>
            </div>
          )}
          {result.status === 'completed' && result.creditsCost > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {result.duration > 0 && `Completed in ${(result.duration / 1000).toFixed(1)}s | `}
              {result.creditsCost} credits (~{creditsToDollars(result.creditsCost)}) used
            </p>
          )}
          {result.status === 'failed' && (
            <p className="mt-3 text-xs text-destructive">
              Execution failed. Credits have been refunded.
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && !isExecuting && (
        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <p className="mt-1 text-xs text-muted-foreground">If credits were deducted, they will be refunded.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={reset}>
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isExecuting && (
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
          <p className="mt-4 text-sm font-medium text-foreground">
            {progress?.message || 'Running tool...'}
          </p>
          {progress?.stepIndex !== undefined && progress?.totalSteps !== undefined && (
            <p className="mt-1 text-xs text-accent font-medium">
              Executing step {progress.stepIndex + 1} of {progress.totalSteps}...
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {progress?.status === 'running' ? 'Processing your request' : 'This may take a few seconds'}
          </p>
          <div className="mt-4 mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            {progress?.stepIndex !== undefined && progress?.totalSteps ? (
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${((progress.stepIndex + 1) / progress.totalSteps) * 100}%` }}
              />
            ) : (
              <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-6">
          <h3 className="text-sm font-semibold text-foreground">Confirm execution</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This will deduct <span className="font-semibold text-accent">🪙 {tool.creditCost} (~{creditsToDollars(tool.creditCost)})</span> from
            your balance (currently 🪙 {balance}).
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Button variant="accent" size="sm" onClick={handleConfirmRun} disabled={insufficientCredits}>
              {insufficientCredits ? 'Insufficient Credits' : `Run — ${tool.creditCost} Credits`}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            {insufficientCredits && (
              <Link href="/dashboard/credits" className="text-sm text-accent hover:text-accent/80">
                Buy Credits
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Input Form (show when no result and not executing) */}
      {!result && !isExecuting && !showConfirm && (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-primary">Inputs</h2>
          <div className="mt-4">
            <DynamicForm
              schema={tool.inputSchema}
              onSubmit={handleFormSubmit}
              submitLabel={`Run Tool — ${tool.creditCost} Credits (~${creditsToDollars(tool.creditCost)})`}
              disabled={insufficientCredits}
            />
            {insufficientCredits && (
              <p className="mt-3 text-center text-sm text-destructive">
                Insufficient credits.{' '}
                <Link href="/dashboard/credits" className="font-medium text-accent hover:text-accent/80">
                  Buy more credits
                </Link>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
