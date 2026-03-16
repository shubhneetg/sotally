'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  creditBalance: number;
  createdAt: string;
  totalExecutions: number;
}

interface PaginatedUsers {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('q', search);
      const res = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleAction = async (userId: string, action: string, payload: Record<string, any>) => {
    if (!token) return;
    setActionLoading(userId);
    try {
      await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      await fetchUsers();
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive' as const;
      case 'creator':
        return 'accent' as const;
      case 'affiliate':
        return 'default' as const;
      default:
        return 'muted' as const;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">User Management</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No users found.</div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-7 sm:gap-4 sm:px-6">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span className="text-right">Credits</span>
              <span>Joined</span>
              <span className="text-right">Executions</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {data.items.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-7 sm:items-center sm:gap-4 sm:px-6"
                >
                  <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
                  <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                  <span>
                    <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
                  </span>
                  <span className="text-sm text-foreground sm:text-right">
                    {user.creditBalance.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-foreground sm:text-right">
                    {user.totalExecutions.toLocaleString()}
                  </span>
                  <div className="flex gap-1 sm:justify-end">
                    <select
                      className="rounded border border-border bg-card px-2 py-1 text-xs text-foreground"
                      defaultValue=""
                      disabled={actionLoading === user.id}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) return;
                        e.target.value = '';

                        switch (value) {
                          case 'make_admin':
                            handleAction(user.id, 'change role', { role: 'admin' });
                            break;
                          case 'make_creator':
                            handleAction(user.id, 'change role', { role: 'creator' });
                            break;
                          case 'make_buyer':
                            handleAction(user.id, 'change role', { role: 'buyer' });
                            break;
                          case 'grant_100':
                            handleAction(user.id, 'grant credits', {
                              creditAdjustment: 100,
                              reason: 'Admin granted 100 credits',
                            });
                            break;
                        }
                      }}
                    >
                      <option value="">Actions</option>
                      <option value="make_admin">Make Admin</option>
                      <option value="make_creator">Make Creator</option>
                      <option value="make_buyer">Make Buyer</option>
                      <option value="grant_100">Grant 100 Credits</option>
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
