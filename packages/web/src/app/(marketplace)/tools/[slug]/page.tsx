import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Placeholder tool data (would come from API in production)
const tool = {
  name: 'Image Background Remover',
  slug: 'image-bg-remover',
  icon: '🖼️',
  description:
    'Remove backgrounds from any image in seconds using AI-powered edge detection. Supports PNG, JPG, and WebP formats. Perfect for e-commerce product photos, profile pictures, and design assets.',
  category: 'Design',
  rating: 4.8,
  runCount: 12400,
  creditCost: 2,
  creatorName: 'PixelLab',
  creatorAvatar: null,
};

const sampleReviews = [
  { id: 1, user: 'Sarah M.', rating: 5, comment: 'Incredible quality — better than most paid alternatives.', date: '2 days ago' },
  { id: 2, user: 'James K.', rating: 4, comment: 'Works great for product photos. Edges are very clean.', date: '1 week ago' },
  { id: 3, user: 'Priya R.', rating: 5, comment: 'Fast and accurate. Using it daily for my Shopify store.', date: '2 weeks ago' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-muted-foreground">{rating}</span>
    </div>
  );
}

export default function ToolDetailPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Left Column — Tool Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tool Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-3xl">
                {tool.icon}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-primary sm:text-3xl">{tool.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Badge variant="outline">{tool.category}</Badge>
                  <StarRating rating={tool.rating} />
                  <span className="text-sm text-muted-foreground">
                    {tool.runCount.toLocaleString()} runs
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  by <span className="font-medium text-foreground">{tool.creatorName}</span>
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-primary">About this tool</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{tool.description}</p>
            </div>

            {/* Input Form Placeholder */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-primary">Inputs</h2>
              <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Tool inputs will render here based on the tool&apos;s schema.
                </p>
              </div>
            </div>

            {/* Sample Output */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-primary">Sample Output</h2>
              <div className="mt-4 rounded-lg bg-muted/50 p-6">
                <p className="text-sm text-muted-foreground font-mono">
                  &#123; &quot;status&quot;: &quot;success&quot;, &quot;output_url&quot;: &quot;https://cdn.sotally.com/results/...&quot; &#125;
                </p>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-lg font-semibold text-primary">Reviews</h2>
              <div className="mt-4 space-y-4">
                {sampleReviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{review.user}</span>
                        <StarRating rating={review.rating} />
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column — Pricing & Action */}
          <div>
            <div className="sticky top-6 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  <span className="text-accent">🪙</span> {tool.creditCost}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">credits per run</p>
              </div>
              <Link
                href={`/tools/${tool.slug}/run`}
                className="mt-6 block w-full rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
              >
                Run Tool — {tool.creditCost} Credits
              </Link>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Don&apos;t have credits?{' '}
                <Link href="/register" className="text-accent hover:text-accent/80">
                  Sign up for 50 free
                </Link>
              </p>
              <div className="mt-6 border-t border-border pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium text-foreground">{tool.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total runs</span>
                    <span className="font-medium text-foreground">{tool.runCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-medium text-foreground">{tool.rating}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator</span>
                    <span className="font-medium text-foreground">{tool.creatorName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
