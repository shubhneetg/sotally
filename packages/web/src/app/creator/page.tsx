'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface Analytics {
  totalRuns: number;
  totalEarnings: number;
  topTools: Array<{ toolId: string; name: string; runs: number; earnings: number }>;
  dailyStats: Array<{ date: string; runs: number; earnings: number }>;
}

interface ToolItem {
  id: string;
  slug: string;
  name: string;
  status: string;
  totalRuns: number;
  avgRating: string | null;
  earnings: number;
}

export default function CreatorDashboardPage() {
  const { token } = useAuthStore();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const [analyticsRes, toolsRes] = await Promise.all([
          api.creator.analytics(token!, 30) as Promise<{ success: boolean; data: Analytics }>,
          api.creator.listTools(token!, { page: 1 }) as Promise<{
            success: boolean;
            data: { items: ToolItem[] };
          }>,
        ]);

        if (analyticsRes.success) setAnalytics(analyticsRes.data);
        if (toolsRes.success) setTools(toolsRes.data.items);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  const totalTools = tools.length;
  const publishedTools = tools.filter((t) => t.status === 'published').length;
  const avgRating =
    tools.length > 0
      ? (
          tools.reduce((sum, t) => sum + (parseFloat(t.avgRating || '0') || 0), 0) /
          tools.filter((t) => t.avgRating).length || 0
        ).toFixed(1)
      : '0.0';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded-lg bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your creator activity</p>
        </div>
        <Link href="/creator/tools/new">
          <Button variant="accent">Create New Tool</Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalTools}</div>
            <p className="mt-1 text-xs text-muted-foreground">{publishedTools} published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {(analytics?.totalRuns ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Earnings (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {(analytics?.totalEarnings ?? 0).toLocaleString()} credits
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{avgRating}</div>
            <p className="mt-1 text-xs text-muted-foreground">out of 5.0</p>
          </CardContent>
        </Card>
      </div>

      {/* Top performing tools */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Tools</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.topTools && analytics.topTools.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Tool</th>
                    <th className="pb-3 font-medium text-muted-foreground">Runs</th>
                    <th className="pb-3 font-medium text-muted-foreground">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.topTools.slice(0, 5).map((tool) => (
                    <tr key={tool.toolId}>
                      <td className="py-3 font-medium text-foreground">{tool.name}</td>
                      <td className="py-3 text-muted-foreground">{tool.runs.toLocaleString()}</td>
                      <td className="py-3 text-accent">{tool.earnings.toLocaleString()} credits</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No tool activity yet.</p>
              <Link href="/creator/tools/new" className="mt-2 inline-block text-sm text-accent hover:text-accent/80">
                Create your first tool
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent tools */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Tools</CardTitle>
          <Link href="/creator/tools" className="text-sm text-accent hover:text-accent/80">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {tools.length > 0 ? (
            <div className="space-y-3">
              {tools.slice(0, 5).map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-foreground">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tool.totalRuns.toLocaleString()} runs
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        tool.status === 'published'
                          ? 'default'
                          : tool.status === 'draft'
                          ? 'muted'
                          : 'destructive'
                      }
                    >
                      {tool.status}
                    </Badge>
                    <Link
                      href={`/creator/tools/${tool.id}/edit`}
                      className="text-sm text-accent hover:text-accent/80"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">You haven't created any tools yet.</p>
              <Link href="/creator/tools/new">
                <Button variant="accent" className="mt-4">
                  Create Your First Tool
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
