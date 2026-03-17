import Link from 'next/link';

interface CreditBadgeProps {
  balance: number;
}

export function CreditBadge({ balance }: CreditBadgeProps) {
  const isLow = balance < 10;

  return (
    <div className="relative group">
      <Link
        href="/dashboard/credits"
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          isLow
            ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
            : 'bg-accent/10 text-accent hover:bg-accent/20'
        }`}
      >
        <span>🪙</span>
        <span>{balance.toLocaleString()}</span>
      </Link>
      {isLow && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          Running low! Buy more credits.
        </div>
      )}
    </div>
  );
}
