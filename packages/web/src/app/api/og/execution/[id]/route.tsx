import { ImageResponse } from 'next/og';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Fetch execution data (server-side, no auth needed for OG images)
  let toolName = 'Sotally Tool';
  let resultPreview = 'Check out this result!';
  let credits = 0;

  try {
    const res = await fetch(`${API_URL}/executions/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const exec = data.data;
      if (exec) {
        credits = exec.creditsCharged || 0;
        const output = typeof exec.output === 'string' ? exec.output : JSON.stringify(exec.output || '');
        resultPreview = output.slice(0, 200) + (output.length > 200 ? '...' : '');
      }
    }
  } catch {
    // Use defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#0F172A',
          color: '#fff',
          fontFamily: 'Inter',
          padding: '48px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ fontSize: '20px', color: '#10B981', fontWeight: 'bold' }}>
            sotally.com
          </div>
          {credits > 0 && (
            <div style={{ fontSize: '16px', color: '#94A3B8' }}>
              {credits} credits used
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: '20px',
          }}
        >
          {toolName}
        </div>

        <div
          style={{
            fontSize: '18px',
            color: '#CBD5E1',
            lineHeight: '1.6',
            flex: 1,
            overflow: 'hidden',
            borderLeft: '3px solid #7C3AED',
            paddingLeft: '16px',
          }}
        >
          {resultPreview}
        </div>

        <div style={{ fontSize: '16px', color: '#64748B', marginTop: '20px' }}>
          Generated with Sotally — Software without subscriptions
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
