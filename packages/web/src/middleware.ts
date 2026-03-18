import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PLATFORM_SUBDOMAINS = new Set(['www', 'api', 'app', 'admin', 'cdn', 'docs']);
const SOTALLY_DOMAINS = ['sotally.com', 'sotools.com'];

function extractSubdomain(hostname: string): string | null {
  for (const domain of SOTALLY_DOMAINS) {
    if (hostname.endsWith(`.${domain}`)) {
      const sub = hostname.slice(0, -(domain.length + 1));
      if (sub && !PLATFORM_SUBDOMAINS.has(sub)) {
        return sub;
      }
      return null;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // --- V2: Creator subdomain routing ---
  const subdomain = extractSubdomain(hostname);
  if (subdomain) {
    const url = request.nextUrl.clone();

    // creator.sotally.com/ → storefront home
    // creator.sotally.com/app-slug → app runner page
    if (pathname === '/' || pathname === '') {
      url.pathname = `/storefront/${subdomain}`;
    } else {
      // Nested paths under the storefront
      url.pathname = `/storefront/${subdomain}${pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  // --- V1: Custom domain support ---
  const isKnownDomain = SOTALLY_DOMAINS.some(
    (d) => hostname === d || hostname === `www.${d}` || hostname.endsWith(`.${d}`)
  );
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  if (!isKnownDomain && !isLocalhost) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';
      const res = await fetch(
        `${apiUrl}/creator/domains/lookup?domain=${encodeURIComponent(hostname)}`,
        { next: { revalidate: 300 } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.userName) {
          const url = request.nextUrl.clone();
          url.pathname = `/storefront/${encodeURIComponent(data.data.userName)}${pathname}`;
          return NextResponse.rewrite(url);
        }
      }
    } catch {
      // Domain lookup failed — pass through
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
