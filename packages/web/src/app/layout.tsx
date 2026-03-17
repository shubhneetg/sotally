import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Sotally — Software without subscriptions',
  description:
    'Access 1000+ software tools without subscriptions. Pay only for what you use with credits. Browse, run, and pay per use.',
  manifest: '/manifest.json',
  themeColor: '#7c3aed',
  openGraph: {
    title: 'Sotally — Software without subscriptions',
    description: 'Access 1000+ software tools. Pay per use, no subscriptions.',
    url: 'https://sotally.com',
    siteName: 'Sotally',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sotally — Software without subscriptions',
    description: 'Access 1000+ software tools. Pay per use, no subscriptions.',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans bg-background text-foreground antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
