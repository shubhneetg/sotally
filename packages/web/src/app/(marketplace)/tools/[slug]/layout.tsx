import type { Metadata } from 'next';

interface ToolLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Format slug into readable title: "image-bg-remover" -> "Image Bg Remover"
  const title = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${title} | Sotally`,
    description: `Run ${title} on Sotally. Pay only for what you use.`,
    openGraph: {
      title: `${title} | Sotally`,
      description: `Run ${title} on Sotally. Software without subscriptions.`,
      type: 'website',
      siteName: 'Sotally',
      url: `https://sotally.com/tools/${slug}`,
      images: [`https://sotally.com/api/og/${slug}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Sotally`,
      description: `Run ${title} on Sotally. Pay only for what you use.`,
      images: [`https://sotally.com/api/og/${slug}`],
    },
  };
}

export default async function ToolLayout({ children, params }: ToolLayoutProps) {
  const { slug } = await params;

  const title = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: title,
    url: `https://sotally.com/tools/${slug}`,
    applicationCategory: 'UtilitiesApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
