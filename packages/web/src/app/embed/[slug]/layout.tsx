import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-4">{children}</div>
      <div className="border-t border-border px-4 py-3 text-center">
        <a
          href="https://sotally.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Powered by <span className="font-semibold text-accent">Sotally</span>
        </a>
      </div>
    </div>
  );
}
