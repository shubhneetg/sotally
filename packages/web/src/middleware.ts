import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // Check for sotools.com subdomains
  if (hostname.endsWith('.sotools.com') && !hostname.startsWith('www.')) {
    const username = hostname.split('.')[0];
    // Rewrite to the creator storefront page
    const url = request.nextUrl.clone();
    url.pathname = `/creators/${username}${request.nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Check for custom domains (not sotally.com or sotools.com)
  if (!hostname.includes('sotally.com') && !hostname.includes('sotools.com') && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';
      const res = await fetch(`${apiUrl}/creator/domains/lookup?domain=${encodeURIComponent(hostname)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.userName) {
          const url = request.nextUrl.clone();
          url.pathname = `/creators/${encodeURIComponent(data.data.userName)}${request.nextUrl.pathname}`;
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
