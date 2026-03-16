'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditBadge } from '@/components/credits/credit-badge';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/tools', label: 'My Tools', icon: '🛠️' },
  { href: '/dashboard/credits', label: 'Credits', icon: '🪙' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-primary">
            Sotally
          </Link>
          <div className="flex items-center gap-4">
            <CreditBadge balance={247} />
            <div className="h-8 w-8 rounded-full bg-accent/20 text-center leading-8 text-sm font-medium text-accent">
              U
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-0 px-4 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-border bg-card py-6 pr-4 md:block">
          <div className="mb-6 rounded-xl bg-accent/10 p-4 text-center">
            <p className="text-xs text-muted-foreground">Credit Balance</p>
            <p className="mt-1 text-2xl font-bold text-primary">🪙 247</p>
          </div>
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
                <span>{item.icon}</span>
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
