import { ImageResponse } from 'next/og';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const title = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#0F172A',
          color: '#fff',
          fontFamily: 'Inter',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: '24px', color: '#10B981', marginBottom: '16px' }}>
          sotally.com
        </div>
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: '20px', color: '#94A3B8' }}>
          Software without subscriptions — Pay only for what you use
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
