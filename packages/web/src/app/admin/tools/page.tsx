'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminTool {
  id: string;
  name: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  totalRuns: number;
  avgRating: string | null;
  createdAt: string;
  creatorId: string;
  creatorName: string;
}

interface PaginatedTools {
  items: AdminTool[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

export default function AdminToolsPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<PaginatedTools | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API_URL}/admin/tools?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('Failed to fetch tools:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, statusFilter]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleAction = async (toolId: string, action: string) => {
    if (!token) return;
    setActionLoading(toolId);
    try {
      await fetch(`${API_URL}/admin/tools/${toolId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      await fetchTools();
    } catch (err) {
      console.error(`Failed to ${action} tool:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'accent' as const;
      case 'pending_review':
        return 'default' as const;
      case 'suspended':
        return 'destructive' as const;
      case 'archived':
        return 'muted' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Tool Management</h1>

      {/* Status Filter */}
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={statusFilter === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter(opt.value);
              setPage(1);
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No tools found.</div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-7 sm:gap-4 sm:px-6">
              <span>Name</span>
              <span>Creator</span>
              <span>Status</span>
              <span className="text-right">Runs</span>
              <span className="text-right">Rating</span>
              <span>Created</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {data.items.map((tool) => (
                <div
                  key={tool.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-7 sm:items-center sm:gap-4 sm:px-6"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                    {tool.isFeatured && (
                      <span className="text-xs text-accent font-medium">Featured</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground truncate">{tool.creatorName}</span>
                  <span>
                    <Badge variant={statusBadgeVariant(tool.status)}>{tool.status}</Badge>
                  </span>
                  <span className="text-sm text-foreground sm:text-right">
                    {tool.totalRuns.toLocaleString()}
                  </span>
                  <span className="text-sm text-foreground sm:text-right">
                    {tool.avgRating ? parseFloat(tool.avgRating).toFixed(1) : '-'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(tool.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1 sm:justify-end">
                    <select
                      className="rounded border border-border bg-card px-2 py-1 text-xs text-foreground"
                      defaultValue=""
                      disabled={actionLoading === tool.id}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) return;
                        e.target.value = '';
                        handleAction(tool.id, value);
                      }}
                    >
                      <option value="">Actions</option>
                      <option value="publish">Publish</option>
                      <option value="suspend">Suspend</option>
                      <option value="archive">Archive</option>
                      {tool.isFeatured ? (
                        <option value="unfeature">Unfeature</option>
                      ) : (
                        <option value="feature">Feature</option>
                      )}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {data.page} of {data.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.totalPages}
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
