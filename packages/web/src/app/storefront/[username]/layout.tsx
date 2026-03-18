'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const username = params.username as string;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal storefront header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href={`/storefront/${username}`}
            className="text-lg font-semibold text-primary"
          >
            {username}
          </Link>
          <Link
            href="https://sotally.com"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Powered by{' '}
            <span className="font-semibold text-accent">Sotally</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
