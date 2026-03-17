import Link from 'next/link';

function creditsToDollars(credits: number): string {
  return `$${(credits * 0.03).toFixed(2)}`;
}

interface ToolCardProps {
  name: string;
  slug: string;
  description: string;
  icon: string;
  rating: number;
  runCount: number;
  creditCost: number;
  creatorName: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-3.5 w-3.5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}</span>
    </div>
  );
}

export function ToolCard({
  name,
  slug,
  description,
  icon,
  rating,
  runCount,
  creditCost,
  creatorName,
}: ToolCardProps) {
  return (
    <Link
      href={`/tools/${slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Icon + Name */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
            {name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            by {creatorName}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {/* Footer: Rating, Runs, Price */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3">
          <StarRating rating={rating} />
          <span className="text-xs text-muted-foreground">
            {runCount >= 1000 ? `${(runCount / 1000).toFixed(1)}k` : runCount} runs
          </span>
        </div>
        <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
          🪙 {creditCost} (~{creditsToDollars(creditCost)})
        </span>
      </div>
    </Link>
  );
}
