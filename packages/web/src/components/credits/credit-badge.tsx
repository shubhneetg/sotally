import Link from 'next/link';

interface CreditBadgeProps {
  balance: number;
}

export function CreditBadge({ balance }: CreditBadgeProps) {
  return (
    <Link
      href="/dashboard/credits"
      className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/20 transition-colors"
    >
      <span>🪙</span>
      <span>{balance.toLocaleString()}</span>
    </Link>
  );
}
