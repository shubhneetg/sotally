import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function StorefrontNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-muted">
          <span className="text-5xl font-bold text-muted-foreground">404</span>
        </div>

        <h1 className="mt-8 text-2xl font-bold text-foreground">Creator not found</h1>
        <p className="mt-2 text-muted-foreground">
          This storefront doesn&apos;t exist. The creator may have changed their username or removed their page.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className={buttonVariants({ variant: 'accent' })}>
            Back to home
          </Link>
          <Link href="/tools" className={buttonVariants({ variant: 'outline' })}>
            Browse tools
          </Link>
        </div>
      </div>
    </div>
  );
}
