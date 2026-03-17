import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

interface ToolLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

async function fetchToolData(slug: string) {
  try {
    const res = await fetch(`${API_URL}/tools/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = await fetchToolData(slug);

  const name = tool?.name || slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const description = tool?.description || `Run ${name} on Sotally. Pay only for what you use.`;
  const category = tool?.category?.name || '';
  const creator = tool?.creator?.name || 'Sotally';
  const ogImage = `https://sotally.com/api/og/${slug}`;

  return {
    title: `${name} — ${category ? category + ' ' : ''}AI Tool | Sotally`,
    description: `${description} By ${creator}. Pay per use, no subscription.`,
    openGraph: {
      title: name,
      description,
      type: 'website',
      siteName: 'Sotally',
      url: `https://sotally.com/tools/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: [ogImage],
    },
  };
}

export default async function ToolLayout({ children, params }: ToolLayoutProps) {
  const { slug } = await params;
  const tool = await fetchToolData(slug);

  const name = tool?.name || slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const description = tool?.description || '';
  const creator = tool?.creator?.name || 'Sotally';
  const rating = tool?.avgRating ? parseFloat(tool.avgRating) : 0;
  const runs = tool?.totalRuns || 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url: `https://sotally.com/tools/${slug}`,
    applicationCategory: 'UtilitiesApplication',
    author: { '@type': 'Person', name: creator },
    ...(rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.toFixed(1),
        bestRating: '5',
        ratingCount: Math.max(runs, 1),
      },
    }),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
