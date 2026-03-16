'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface Analytics {
  totalRuns: number;
  totalEarnings: number;
  topTools: Array<{ toolId: string; name: string; runs: number; earnings: number }>;
  dailyStats: Array<{ date: string; runs: number; earnings: number }>;
}

const dateRanges = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function AnalyticsPage() {
  const { token } = useAuthStore();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!token) return;

    async function load() {
      setLoading(true);
      try {
        const res = (await api.creator.analytics(token!, days)) as {
          success: boolean;
          data: Analytics;
        };
        if (res.success) setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, days]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const maxRuns = analytics?.dailyStats
    ? Math.max(...analytics.dailyStats.map((d) => d.runs), 1)
    : 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Analytics</h1>
          <p className="text-muted-foreground">Track your tools performance</p>
        </div>

        {/* Date range selector */}
        <div className="flex gap-2">
          {dateRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setDays(range.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                days === range.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Runs ({days}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {(analytics?.totalRuns ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings ({days}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {(analytics?.totalEarnings ?? 0).toLocaleString()} credits
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Runs chart (bar chart using divs) */}
      <Card>
        <CardHeader>
          <CardTitle>Runs Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
            <div className="space-y-4">
              {/* Simple bar chart */}
              <div className="flex items-end gap-1" style={{ height: '200px' }}>
                {analytics.dailyStats.map((day) => (
                  <div
                    key={day.date}
                    className="group relative flex-1"
                    style={{ height: '100%' }}
                  >
                    <div
                      className="absolute bottom-0 w-full rounded-t bg-accent/80 transition-colors group-hover:bg-accent"
                      style={{
                        height: `${Math.max(2, (day.runs / maxRuns) * 100)}%`,
                      }}
                    />
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                      {day.date}: {day.runs} runs
                    </div>
                  </div>
                ))}
              </div>
              {/* X-axis labels */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{analytics.dailyStats[0]?.date}</span>
                <span>{analytics.dailyStats[analytics.dailyStats.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No data for this period. Start building tools to see analytics.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-tool breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Per-Tool Breakdown</CardTitle>
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
                    <th className="pb-3 font-medium text-muted-foreground">Avg/Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.topTools.map((tool) => (
                    <tr key={tool.toolId}>
                      <td className="py-3 font-medium text-foreground">{tool.name}</td>
                      <td className="py-3 text-muted-foreground">{tool.runs.toLocaleString()}</td>
                      <td className="py-3 text-accent">{tool.earnings.toLocaleString()} cr</td>
                      <td className="py-3 text-muted-foreground">
                        {(tool.runs / days).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No tool data available for this period.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top referrers placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Referrer tracking coming soon. You'll be able to see where your traffic comes from.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
