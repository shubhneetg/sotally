import type { MetadataRoute } from 'next';
import { INTEGRATIONS } from '@/data/integrations';
import { GUIDES } from '@/data/guides';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sotally.com';

  // Fetch all published tools
  let toolSlugs: string[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/tools?per_page=100`);
    const data = await res.json();
    toolSlugs = data.data?.items?.map((t: any) => t.slug) || [];
  } catch {}

  const staticPages = [
    '', '/tools', '/pricing', '/about', '/terms', '/privacy',
    '/login', '/register', '/integrations', '/bounties', '/guides',
  ];

  return [
    ...staticPages.map(path => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.8,
    })),
    ...toolSlugs.map(slug => ({
      url: `${baseUrl}/tools/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    ...INTEGRATIONS.map(integration => ({
      url: `${baseUrl}/integrations/${integration.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...GUIDES.map(guide => ({
      url: `${baseUrl}/guides/${guide.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
  ];
}
