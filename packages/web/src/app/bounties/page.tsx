'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface Bounty {
  id: string;
  title: string;
  description: string;
  creditReward: number;
  status: string;
  requesterName: string;
  createdAt: string;
}

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState(50);
  const [creating, setCreating] = useState(false);
  const { isAuthenticated, token } = useAuthStore();

  const fetchBounties = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/bounties`);
      const data = await res.json();
      setBounties(data.data?.items || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBounties(); }, [fetchBounties]);

  const handleCreate = async () => {
    if (!token || !title || !description || reward < 5) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/bounties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, creditReward: reward }),
      });
      if (res.ok) {
        setShowCreate(false);
        setTitle('');
        setDescription('');
        setReward(50);
        fetchBounties();
      }
    } catch {
      // Error handling
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Tool Bounties</h1>
          <p className="mt-1 text-muted-foreground">Request tools and offer credit rewards to creators who build them.</p>
        </div>
        {isAuthenticated && (
          <Button variant="accent" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : 'Post Bounty'}
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-6">
          <h3 className="text-lg font-semibold text-foreground">Post a Bounty</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What tool do you need?"
                className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what the tool should do, inputs, expected outputs..."
                rows={4}
                className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Credit Reward</label>
              <input
                type="number"
                value={reward}
                onChange={(e) => setReward(parseInt(e.target.value) || 5)}
                min={5}
                className="mt-1 w-32 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <p className="mt-1 text-xs text-muted-foreground">Minimum 5 credits. Credits will be held until bounty is fulfilled or cancelled.</p>
            </div>
            <Button variant="accent" onClick={handleCreate} disabled={creating || !title || !description || reward < 5}>
              {creating ? 'Posting...' : `Post Bounty (${reward} credits)`}
            </Button>
          </div>
        </div>
      )}

      {/* Bounty List */}
      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : bounties.length > 0 ? (
        <div className="mt-8 space-y-4">
          {bounties.map((bounty) => (
            <div key={bounty.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary">{bounty.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">by {bounty.requesterName || 'Anonymous'}</p>
                </div>
                <span className="inline-flex items-center rounded-md bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
                  {bounty.creditReward} credits
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{bounty.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Posted {new Date(bounty.createdAt).toLocaleDateString()}
                </span>
                {isAuthenticated && (
                  <Link href={`/creator/tools/new`} className="text-sm font-medium text-accent hover:text-accent/80">
                    Submit a tool
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold text-primary">No bounties yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Be the first to post a bounty!</p>
        </div>
      )}

      {!isAuthenticated && (
        <div className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-6 text-center">
          <p className="text-sm text-foreground">Sign in to post bounties or submit tools.</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link href="/login" className="text-sm font-medium text-accent hover:text-accent/80">Log in</Link>
            <Link href="/register" className="text-sm font-medium text-accent hover:text-accent/80">Create account</Link>
          </div>
        </div>
      )}
    </div>
  );
}
