'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface CreatorTool {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string | null;
  pricing: Record<string, unknown>;
  totalRuns: number;
  avgRating: string | null;
  createdAt: string;
}

interface CreatorProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  specialization: string | null;
  website: string | null;
  socialLinks: Record<string, string> | null;
  level: string;
  verified: boolean;
  memberSince: string;
  stats: {
    totalTools: number;
    totalRuns: number;
    avgRating: string | null;
  };
  tools: CreatorTool[];
}

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = (await api.creators.profile(username)) as {
          success: boolean;
          data: CreatorProfile;
        };
        if (res.success) {
          setCreator(res.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load creator profile');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [username]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="space-y-6">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-primary">Creator Not Found</h1>
        <p className="mt-2 text-muted-foreground">{error || 'This creator profile does not exist.'}</p>
        <Link href="/tools">
          <Button variant="accent" className="mt-6">
            Browse Tools
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Creator header */}
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-3xl font-bold text-accent">
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creator.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            creator.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">{creator.name}</h1>
            {creator.verified && (
              <Badge variant="accent">Verified</Badge>
            )}
            <Badge variant="muted">{creator.level}</Badge>
          </div>
          {creator.specialization && (
            <p className="mt-1 text-muted-foreground">{creator.specialization}</p>
          )}
          {creator.bio && (
            <p className="mt-2 text-foreground">{creator.bio}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Member since {new Date(creator.memberSince).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <div>
          <Button variant="outline" disabled>
            Follow
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">{creator.stats.totalTools}</div>
            <p className="mt-1 text-sm text-muted-foreground">Published Tools</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">
              {creator.stats.totalRuns.toLocaleString()}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Total Runs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">
              {creator.stats.avgRating ?? '--'}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Tools grid */}
      <div className="mt-10">
        <h2 className="mb-6 text-xl font-bold text-primary">Published Tools</h2>
        {creator.tools.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creator.tools.map((tool) => (
              <Link key={tool.id} href={`/tools/${tool.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-lg font-bold text-accent">
                        {tool.iconUrl ? (
                          <img src={tool.iconUrl} alt="" className="h-10 w-10 rounded-lg" />
                        ) : (
                          tool.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{tool.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{tool.totalRuns.toLocaleString()} runs</span>
                      {tool.avgRating && parseFloat(tool.avgRating) > 0 && (
                        <span>{parseFloat(tool.avgRating).toFixed(1)} rating</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            This creator hasn't published any tools yet.
          </div>
        )}
      </div>
    </div>
  );
}
