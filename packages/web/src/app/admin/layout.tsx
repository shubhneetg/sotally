'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import React, { useEffect } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'chart' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/tools', label: 'Tools', icon: 'tools' },
  { href: '/admin/reports', label: 'Reports', icon: 'flag' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    setHydrated(true);
    if (!isAuthenticated) loadUser();
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse">Loading...</div></div>;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold text-primary">
              Sotally
            </Link>
            <Badge variant="destructive">Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <div className="h-8 w-8 rounded-full bg-destructive/20 text-center leading-8 text-sm font-medium text-destructive">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-0 px-4 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-border bg-card py-6 pr-4 md:block">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-muted text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-6 md:pl-6">
          {children}
        </main>
      </div>
    </div>
  );
}
