import Link from 'next/link';
import { ToolCard } from '@/components/marketplace/tool-card';

const tools = [
  {
    name: 'Image Background Remover',
    slug: 'image-bg-remover',
    description: 'Remove backgrounds from any image in seconds with AI precision.',
    icon: '🖼️',
    rating: 4.8,
    runCount: 12400,
    creditCost: 2,
    creatorName: 'PixelLab',
  },
  {
    name: 'PDF Invoice Generator',
    slug: 'pdf-invoice-generator',
    description: 'Generate professional invoices from structured data instantly.',
    icon: '📄',
    rating: 4.6,
    runCount: 8300,
    creditCost: 1,
    creatorName: 'DocForge',
  },
  {
    name: 'SEO Meta Analyzer',
    slug: 'seo-meta-analyzer',
    description: 'Analyze any URL for SEO issues and get actionable recommendations.',
    icon: '🔍',
    rating: 4.9,
    runCount: 21000,
    creditCost: 3,
    creatorName: 'RankWise',
  },
  {
    name: 'Color Palette Generator',
    slug: 'color-palette-generator',
    description: 'Generate beautiful color palettes from an image or keyword.',
    icon: '🎨',
    rating: 4.7,
    runCount: 6200,
    creditCost: 1,
    creatorName: 'ChromaCraft',
  },
  {
    name: 'Email Template Builder',
    slug: 'email-template-builder',
    description: 'Create responsive HTML email templates with a visual editor.',
    icon: '📧',
    rating: 4.5,
    runCount: 4100,
    creditCost: 2,
    creatorName: 'MailSmith',
  },
  {
    name: 'JSON Formatter & Validator',
    slug: 'json-formatter',
    description: 'Format, validate, and transform JSON data with advanced options.',
    icon: '{ }',
    rating: 4.9,
    runCount: 31500,
    creditCost: 1,
    creatorName: 'DevUtils',
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-primary">
            Sotally
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-primary sm:text-4xl">Explore Tools</h1>
          <p className="text-muted-foreground">
            Browse our marketplace of 1000+ tools. Pay per use, no subscriptions.
          </p>
        </div>

        {/* Filters placeholder */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {['All', 'Design', 'Development', 'Marketing', 'Data', 'Writing'].map((category) => (
            <button
              key={category}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                category === 'All'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tool Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} {...tool} />
          ))}
        </div>
      </main>
    </div>
  );
}
