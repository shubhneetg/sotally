'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface ApiToken {
  id: string;
  name: string;
  maskedKey?: string;
  rateLimit: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface UsageStats {
  requestsToday: number;
  requestsThisMonth: number;
}

export default function ApiDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, token, _hasHydrated } = useAuthStore();
  const { addToast } = useToast();

  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [usageStats] = useState<UsageStats>({ requestsToday: 0, requestsThisMonth: 0 });

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !token) {
      router.push('/login?redirect=/dashboard/api');
      return;
    }
    fetchTokens();
  }, [_hasHydrated, isAuthenticated, token, router]);

  async function fetchTokens() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/settings/api-tokens`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApiTokens(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey() {
    if (!newKeyName.trim() || !token) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/settings/api-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setRevealedKey(data.data?.rawKey || null);
        setNewKeyName('');
        addToast('API key created. Copy it now — it will not be shown again.', 'success');
        fetchTokens();
      } else {
        const errData = await res.json().catch(() => null);
        addToast(errData?.error?.message || 'Failed to create API key', 'error');
      }
    } catch {
      addToast('Failed to create API key', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeKey(tokenId: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/settings/api-tokens/${tokenId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        addToast('API key revoked', 'success');
        setApiTokens((prev) => prev.filter((t) => t.id !== tokenId));
      }
    } catch {
      addToast('Failed to revoke key', 'error');
    }
  }

  if (!_hasHydrated || !isAuthenticated) return null;

  const curlExample = `curl -X GET "${API_URL.replace('/api', '')}/api/v1/apps" \\
  -H "Authorization: Bearer sk-your-api-key-here"`;

  const createExample = `curl -X POST "${API_URL.replace('/api', '')}/api/v1/apps" \\
  -H "Authorization: Bearer sk-your-api-key-here" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "A habit tracker with streaks"}'`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your API keys and integrate Sotally into your workflow.
        </p>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Requests Today</p>
            <p className="mt-1 text-3xl font-bold text-primary">{usageStats.requestsToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Requests This Month</p>
            <p className="mt-1 text-3xl font-bold text-primary">{usageStats.requestsThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revealed Key Banner */}
      {revealedKey && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm font-semibold text-foreground">
            Your new API key (copy it now — it will not be shown again):
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground break-all">
              {revealedKey}
            </code>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(revealedKey);
                addToast('API key copied to clipboard', 'success');
              }}
            >
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevealedKey(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Keys */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : apiTokens.length > 0 ? (
            <div className="space-y-3">
              {apiTokens.map((apiToken) => (
                <div
                  key={apiToken.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{apiToken.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {apiToken.maskedKey || 'sk-...'} &middot; Created{' '}
                      {new Date(apiToken.createdAt).toLocaleDateString()}
                      {apiToken.lastUsedAt && (
                        <> &middot; Last used {new Date(apiToken.lastUsedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{apiToken.rateLimit}/min</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRevokeKey(apiToken.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No API keys created yet.</p>
          )}

          {/* Create New Key */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h4 className="text-sm font-medium text-foreground">Create New API Key</h4>
            <div className="flex gap-3">
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g., Production, CI/CD)"
                className="flex-1"
              />
              <Button onClick={handleCreateKey} disabled={!newKeyName.trim() || creating}>
                {creating ? 'Creating...' : 'Create Key'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">List your apps:</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs font-mono text-foreground">
              {curlExample}
            </pre>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Create an app from prompt:</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs font-mono text-foreground">
              {createExample}
            </pre>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              Full API documentation is available at{' '}
              <a
                href="/docs/api"
                className="text-accent hover:text-accent/80 font-medium"
              >
                /docs/api
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
