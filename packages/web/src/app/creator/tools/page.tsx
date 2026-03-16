'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface ToolItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  totalRuns: number;
  avgRating: string | null;
  earnings: number;
  createdAt: string;
}

const statusFilters = ['all', 'published', 'draft', 'archived'] as const;

export default function MyToolsPage() {
  const { token } = useAuthStore();
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!token) return;

    async function load() {
      setLoading(true);
      try {
        const params: { status?: string; page: number } = { page };
        if (filter !== 'all') params.status = filter;

        const res = (await api.creator.listTools(token!, params)) as {
          success: boolean;
          data: { items: ToolItem[]; totalPages: number };
        };

        if (res.success) {
          setTools(res.data.items);
          setTotalPages(res.data.totalPages);
        }
      } catch (err) {
        console.error('Failed to load tools:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, filter, page]);

  const handleArchive = async (id: string) => {
    if (!token || !confirm('Are you sure you want to archive this tool?')) return;
    try {
      await api.creator.archiveTool(token, id);
      setTools((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'archived' } : t)));
    } catch (err) {
      console.error('Failed to archive tool:', err);
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default' as const;
      case 'draft':
        return 'muted' as const;
      case 'archived':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">My Tools</h1>
          <p className="text-muted-foreground">Manage all your created tools</p>
        </div>
        <Link href="/creator/tools/new">
          <Button variant="accent">Create New Tool</Button>
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilter(s);
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Tools list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse rounded-lg bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No tools found.</p>
            <Link href="/creator/tools/new">
              <Button variant="accent" className="mt-4">
                Create Your First Tool
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Tool</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
                <th className="pb-3 font-medium text-muted-foreground">Runs</th>
                <th className="pb-3 font-medium text-muted-foreground">Rating</th>
                <th className="pb-3 font-medium text-muted-foreground">Earnings</th>
                <th className="pb-3 font-medium text-muted-foreground">Created</th>
                <th className="pb-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tools.map((tool) => (
                <tr key={tool.id}>
                  <td className="py-4">
                    <div>
                      <p className="font-medium text-foreground">{tool.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge variant={statusBadgeVariant(tool.status)}>{tool.status}</Badge>
                  </td>
                  <td className="py-4 text-muted-foreground">{tool.totalRuns.toLocaleString()}</td>
                  <td className="py-4 text-muted-foreground">
                    {tool.avgRating ? parseFloat(tool.avgRating).toFixed(1) : '--'}
                  </td>
                  <td className="py-4 text-accent">{tool.earnings.toLocaleString()} cr</td>
                  <td className="py-4 text-muted-foreground">
                    {new Date(tool.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/creator/tools/${tool.id}/edit`}
                        className="text-sm text-accent hover:text-accent/80"
                      >
                        Edit
                      </Link>
                      {tool.status === 'published' && (
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          View
                        </Link>
                      )}
                      {tool.status !== 'archived' && (
                        <button
                          onClick={() => handleArchive(tool.id)}
                          className="text-sm text-destructive hover:text-destructive/80"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
