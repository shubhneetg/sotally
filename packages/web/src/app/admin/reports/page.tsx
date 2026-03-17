'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Report {
  id: string;
  toolId: string;
  toolName: string;
  reporterName: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface PaginatedReports {
  items: Report[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function AdminReportsPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<PaginatedReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), status: statusFilter });
      const res = await fetch(`${API_URL}/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (reportId: string, action: string) => {
    if (!token) return;
    setActionLoading(reportId);
    try {
      await fetch(`${API_URL}/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      await fetchReports();
    } catch (err) {
      console.error(`Failed to ${action} report:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'default' as const;
      case 'resolved':
        return 'accent' as const;
      case 'dismissed':
        return 'muted' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Reports Queue</h1>

      {/* Status Filter */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map((opt) => (
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
          <div className="py-16 text-center text-sm text-muted-foreground">
            No reports found.
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
              <span>Tool</span>
              <span>Reporter</span>
              <span>Reason</span>
              <span>Date</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {data.items.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-6 sm:items-center sm:gap-4 sm:px-6"
                >
                  <span className="text-sm font-medium text-foreground truncate">
                    {report.toolName}
                  </span>
                  <span className="text-sm text-muted-foreground truncate">
                    {report.reporterName}
                  </span>
                  <span className="text-sm text-muted-foreground truncate">{report.reason}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    <Badge variant={statusBadgeVariant(report.status)}>{report.status}</Badge>
                  </span>
                  <div className="flex gap-1 sm:justify-end">
                    {report.status === 'open' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === report.id}
                          onClick={() => handleAction(report.id, 'dismiss')}
                        >
                          Dismiss
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoading === report.id}
                          onClick={() => handleAction(report.id, 'suspend_tool')}
                        >
                          Suspend
                        </Button>
                      </>
                    )}
                    {report.status !== 'open' && (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
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
