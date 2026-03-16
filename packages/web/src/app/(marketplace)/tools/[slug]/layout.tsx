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
    title: `${title} — Sotally`,
    description: `Use ${title} on Sotally. Pay per use with credits, no subscription required.`,
    openGraph: {
      title: `${title} — Sotally`,
      description: `Use ${title} on Sotally. Pay per use with credits, no subscription required.`,
      type: 'website',
      siteName: 'Sotally',
      url: `https://sotally.com/tools/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — Sotally`,
      description: `Use ${title} on Sotally. Pay per use with credits, no subscription required.`,
    },
  };
}

export default async function ToolLayout({ children }: ToolLayoutProps) {
  return <>{children}</>;
}
