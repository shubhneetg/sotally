'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  totalUsers: number;
  totalTools: number;
  executionsToday: number;
  executions30d: number;
  revenue30d: number;
  pendingReviews: number;
  newUsers7d: number;
}

interface RecentSignup {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface RecentTool {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentSignups: RecentSignup[];
  recentTools: RecentTool[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminDashboardPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Failed to load dashboard data.
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: data.stats.totalUsers.toLocaleString() },
    { label: 'Total Tools', value: data.stats.totalTools.toLocaleString() },
    { label: 'Executions Today', value: data.stats.executionsToday.toLocaleString() },
    { label: 'Revenue (30d)', value: `$${data.stats.revenue30d.toFixed(2)}` },
    { label: 'Pending Reviews', value: data.stats.pendingReviews.toLocaleString() },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Signups */}
        <div>
          <h2 className="text-lg font-semibold text-primary">Recent Signups</h2>
          <div className="mt-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="divide-y divide-border">
              {data.recentSignups.map((user) => (
                <div key={user.id} className="flex items-center justify-between px-4 py-3 sm:px-6">
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">{user.role}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {data.recentSignups.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No recent signups.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Tool Submissions */}
        <div>
          <h2 className="text-lg font-semibold text-primary">Recent Tool Submissions</h2>
          <div className="mt-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="divide-y divide-border">
              {data.recentTools.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between px-4 py-3 sm:px-6">
                  <div>
                    <p className="text-sm font-medium text-foreground">{tool.name}</p>
                    <p className="text-xs text-muted-foreground">{tool.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        tool.status === 'published'
                          ? 'accent'
                          : tool.status === 'pending_review'
                            ? 'default'
                            : tool.status === 'suspended'
                              ? 'destructive'
                              : 'muted'
                      }
                    >
                      {tool.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(tool.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {data.recentTools.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No recent tool submissions.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
