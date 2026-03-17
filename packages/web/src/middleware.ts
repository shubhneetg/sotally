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
  if (!hostname.includes('sotally.com') && !hostname.includes('sotools.com') && !hostname.includes('localhost')) {
    // Could be a custom domain — look up in DB (for now, pass through)
    // Future: fetch storefront by domain from API
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
