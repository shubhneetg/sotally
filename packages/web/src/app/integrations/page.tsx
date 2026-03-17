'use client';

import { useState } from 'react';
import Link from 'next/link';
import { INTEGRATIONS, INTEGRATION_CATEGORIES } from '@/data/integrations';

export default function IntegrationsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = INTEGRATIONS.filter((i) => {
    const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || i.category === category;
    return matchesSearch && matchesCategory;
  });

  const activeCount = INTEGRATIONS.filter(i => i.status === 'active').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary sm:text-5xl">
          {INTEGRATIONS.length}+ Integrations
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Connect AI-powered tools to your favorite services. {activeCount} active integrations, more launching weekly.
        </p>
      </div>

      <div className="mt-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search integrations..."
          className="w-full max-w-lg mx-auto block rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {INTEGRATION_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              cat.id === category
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Showing {filtered.length} of {INTEGRATIONS.length} integrations
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((integration) => (
          <Link
            key={integration.id}
            href={`/integrations/${integration.slug}`}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
              {integration.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
                  {integration.name}
                </h3>
                {integration.status === 'active' ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Soon
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{integration.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-lg font-semibold text-primary">No integrations found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search or category.</p>
        </div>
      )}
    </div>
  );
}
