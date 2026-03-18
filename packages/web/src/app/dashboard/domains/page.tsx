'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthHydrated } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface CustomDomain {
  id: string;
  domain: string;
  verified: boolean;
  status: 'pending' | 'active';
  createdAt: string;
}

export default function DomainsPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const _hasHydrated = useAuthHydrated();
  const { addToast } = useToast();

  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !token) {
      router.push('/login?redirect=/dashboard/domains');
      return;
    }
    fetchDomains();
  }, [_hasHydrated, isAuthenticated, token, router]);

  async function fetchDomains() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/domains`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDomains(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDomain() {
    if (!newDomain.trim() || !token) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/domains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      if (res.ok) {
        addToast('Domain added. Follow the DNS instructions to verify.', 'success');
        setNewDomain('');
        fetchDomains();
      } else {
        const errData = await res.json().catch(() => null);
        addToast(errData?.error?.message || 'Failed to add domain', 'error');
      }
    } catch {
      addToast('Failed to add domain', 'error');
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(domainId: string) {
    if (!token) return;
    setVerifying(domainId);
    try {
      const res = await fetch(`${API_URL}/domains/verify/${domainId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.verified) {
          addToast('Domain verified successfully!', 'success');
          fetchDomains();
        } else {
          addToast('DNS records not detected yet. Please wait a few minutes and try again.', 'info');
        }
      }
    } catch {
      addToast('Verification check failed', 'error');
    } finally {
      setVerifying(null);
    }
  }

  async function handleRemoveDomain(domainId: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/domains/${domainId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        addToast('Domain removed', 'success');
        setDomains((prev) => prev.filter((d) => d.id !== domainId));
      }
    } catch {
      addToast('Failed to remove domain', 'error');
    }
  }

  if (!_hasHydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Custom Domains</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect a custom domain to your creator storefront.
        </p>
      </div>

      {/* Add Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Add Domain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="apps.yourdomain.com"
              className="flex-1"
            />
            <Button onClick={handleAddDomain} disabled={!newDomain.trim() || adding}>
              {adding ? 'Adding...' : 'Add Domain'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DNS Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            After adding your domain, configure the following DNS record with your domain provider:
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium text-foreground">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-foreground">Host / Name</th>
                  <th className="px-4 py-2 text-left font-medium text-foreground">Value / Target</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-muted-foreground">CNAME</td>
                  <td className="px-4 py-2 font-mono text-xs text-foreground">your-subdomain</td>
                  <td className="px-4 py-2 font-mono text-xs text-foreground">storefront.sotally.com</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            DNS changes can take up to 48 hours to propagate, but typically complete within a few minutes.
          </p>
        </CardContent>
      </Card>

      {/* Domain List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Domains</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : domains.length > 0 ? (
            <div className="space-y-3">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{domain.domain}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(domain.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {domain.verified || domain.status === 'active' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Active
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="muted">Pending</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(domain.id)}
                          disabled={verifying === domain.id}
                        >
                          {verifying === domain.id ? 'Checking...' : 'Verify'}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveDomain(domain.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No custom domains added yet. Add one above to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
