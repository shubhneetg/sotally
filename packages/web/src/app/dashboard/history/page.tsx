'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Execution {
  id: string;
  toolName: string;
  toolSlug: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  creditsCost: number;
  duration: number;
  createdAt: string;
  output?: unknown;
}

interface ExecutionListResponse {
  executions: Execution[];
  totalPages: number;
  page: number;
}

export default function HistoryPage() {
  const { token } = useAuthStore();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchExecutions = useCallback(async (p: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = (await api.executions.list(token, p)) as ExecutionListResponse;
      setExecutions(data.executions);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch {
      // Error handled silently; user sees empty state
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchExecutions(1);
  }, [fetchExecutions]);

  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'accent' as const;
      case 'failed':
        return 'destructive' as const;
      case 'running':
        return 'default' as const;
      default:
        return 'muted' as const;
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Execution History</h1>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : executions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No executions yet.</p>
            <Link
              href="/tools"
              className="mt-2 inline-block text-sm font-medium text-accent hover:text-accent/80"
            >
              Browse tools to get started
            </Link>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <span>Tool</span>
              <span>Date</span>
              <span>Status</span>
              <span>Credits</span>
              <span className="text-right">Duration</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {executions.map((exec) => (
                <div key={exec.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === exec.id ? null : exec.id)}
                    className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-muted/50 transition-colors sm:grid sm:grid-cols-5 sm:items-center sm:gap-4 sm:px-6"
                  >
                    <span className="text-sm font-medium text-foreground">
                      <Link
                        href={`/tools/${exec.toolSlug}`}
                        className="hover:text-accent transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {exec.toolName}
                      </Link>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(exec.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      <Badge variant={statusVariant(exec.status)}>{exec.status}</Badge>
                    </span>
                    <span className="text-sm text-muted-foreground">🪙 {exec.creditsCost}</span>
                    <span className="text-sm text-muted-foreground sm:text-right">
                      {formatDuration(exec.duration)}
                    </span>
                  </button>

                  {/* Expanded Output */}
                  {expandedId === exec.id && !!exec.output && (
                    <div className="border-t border-border bg-muted/30 px-4 py-4 sm:px-6">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Output</p>
                      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs text-foreground font-mono">
                        {typeof exec.output === 'string'
                          ? exec.output
                          : JSON.stringify(exec.output, null, 2) as string}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchExecutions(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchExecutions(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
