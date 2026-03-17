'use client';

import { useState, useEffect, use } from 'react';
import { DynamicForm } from '@/components/marketplace/dynamic-form';
import { api } from '@/lib/api';

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

interface ExecutionResult {
  status: string;
  output: unknown;
  creditsCost: number;
  duration: number;
}

export default function EmbedToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [tool, setTool] = useState<ToolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [execError, setExecError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTool() {
      setLoading(true);
      setError(null);
      try {
        const res = (await api.tools.get(slug)) as {
          success: boolean;
          data: ToolData;
        };
        setTool(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tool');
      } finally {
        setLoading(false);
      }
    }
    fetchTool();
  }, [slug]);

  const handleSubmit = async (input: Record<string, unknown>) => {
    if (!tool) return;
    setExecuting(true);
    setExecError(null);
    setResult(null);

    try {
      const execRes = (await api.tools.execute('', tool.slug, input)) as {
        success: boolean;
        data: { executionId: string };
      };

      // Poll for result
      const executionId = execRes.data.executionId;
      let attempts = 0;
      const maxAttempts = 60;

      const poll = async (): Promise<void> => {
        attempts++;
        if (attempts > maxAttempts) {
          setExecError('Execution timed out. Please try again.');
          setExecuting(false);
          return;
        }

        try {
          const statusRes = (await api.executions.get('', executionId)) as {
            success: boolean;
            data: ExecutionResult;
          };

          if (statusRes.data.status === 'completed' || statusRes.data.status === 'failed') {
            setResult(statusRes.data);
            setExecuting(false);
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return poll();
          }
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return poll();
        }
      };

      await poll();
    } catch (err) {
      setExecError(err instanceof Error ? err.message : 'Execution failed');
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">{error || 'Tool not found'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tool Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl">
          {tool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-primary truncate">{tool.name}</h1>
          <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="mb-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">Result</span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
              result.status === 'completed'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-destructive/10 text-destructive'
            }`}>
              {result.status}
            </span>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
              {typeof result.output === 'string'
                ? result.output
                : JSON.stringify(result.output, null, 2)}
            </pre>
          </div>
          <button
            onClick={() => { setResult(null); setExecError(null); }}
            className="mt-3 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Run again
          </button>
        </div>
      )}

      {/* Error */}
      {execError && !executing && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{execError}</p>
          <button
            onClick={() => setExecError(null)}
            className="mt-2 text-xs font-medium text-accent hover:text-accent/80"
          >
            Try again
          </button>
        </div>
      )}

      {/* Executing */}
      {executing && (
        <div className="mb-4 rounded-lg border border-border bg-card p-6 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-accent/30 border-t-accent" />
          <p className="mt-3 text-sm text-muted-foreground">Running...</p>
        </div>
      )}

      {/* Form */}
      {!result && !executing && (
        <div className="rounded-lg border border-border bg-card p-4">
          <DynamicForm
            schema={tool.inputSchema}
            onSubmit={handleSubmit}
            submitLabel="Run"
          />
        </div>
      )}
    </div>
  );
}
