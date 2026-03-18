import { SignJWT } from 'jose';

const API_URL = process.env.API_URL || 'http://localhost:4000';
const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  'sotally-dev-secret-change-in-production-32chars';

/**
 * Generate a JWT token compatible with NextAuth / the Sotally API.
 */
export async function generateJWT(
  userId: string,
  email: string,
): Promise<string> {
  const secret = new TextEncoder().encode(NEXTAUTH_SECRET);
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

/**
 * Create a test user by calling the API register endpoint.
 * Returns the user object with id, email, token.
 */
export async function createTestUser(
  slug: string,
  name: string,
  email: string,
  niche?: string,
  bio?: string,
): Promise<{ id: string; email: string; token: string }> {
  const password = 'TestPass123!Secure';

  // Register
  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!registerRes.ok) {
    const text = await registerRes.text();
    throw new Error(`Register failed: ${registerRes.status} - ${text}`);
  }

  const registerBody = await registerRes.json();
  const token = registerBody?.data?.token || registerBody?.token;
  const userId = registerBody?.data?.id || registerBody?.data?.user?.id || registerBody?.id;

  if (!token) {
    throw new Error(
      `No token from registration: ${JSON.stringify(registerBody)}`,
    );
  }

  // Set up creator profile if slug provided
  if (slug) {
    const setupRes = await fetch(`${API_URL}/storefront/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        slug,
        displayName: name,
        ...(bio && { bio }),
        ...(niche && { niche }),
      }),
    });

    if (!setupRes.ok) {
      const text = await setupRes.text();
      console.warn(`Creator setup warning: ${setupRes.status} - ${text}`);
    }
  }

  return { id: userId, email, token };
}

/**
 * Generate an app via the API.
 * Returns the appId.
 */
export async function generateApp(
  token: string,
  prompt: string,
  niche?: string,
): Promise<string> {
  const res = await fetch(`${API_URL}/apps/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      prompt,
      ...(niche && { niche }),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Generate failed: ${res.status} - ${text}`);
  }

  const body = await res.json();
  const appId = body?.data?.appId || body?.data?.id || body?.id;
  if (!appId) {
    throw new Error(`No appId from generate: ${JSON.stringify(body)}`);
  }
  return appId;
}

/**
 * Poll app status until generation completes or times out.
 */
export async function waitForGeneration(
  token: string,
  appId: string,
  timeoutMs = 120_000,
): Promise<'succeeded' | 'failed'> {
  const start = Date.now();
  const pollInterval = 3000;

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${API_URL}/apps/${appId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const body = await res.json();
      const status = body?.data?.status || body?.status;
      if (status === 'succeeded' || status === 'failed') {
        return status;
      }
    }

    await new Promise((r) => setTimeout(r, pollInterval));
  }

  throw new Error(`Generation timed out after ${timeoutMs}ms for app ${appId}`);
}

/**
 * Publish an app.
 */
export async function publishApp(
  token: string,
  appId: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/apps/${appId}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Publish failed: ${res.status} - ${text}`);
  }
}

/**
 * Get the authenticated user's apps.
 */
export async function getApps(
  token: string,
): Promise<Array<{ id: string; name: string; status: string; slug: string }>> {
  const res = await fetch(`${API_URL}/apps/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getApps failed: ${res.status} - ${text}`);
  }

  const body = await res.json();
  const items = Array.isArray(body.data)
    ? body.data
    : body.data?.items || [];
  return items;
}

/**
 * Unique email generator for test isolation.
 */
export function testEmail(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `e2e-${ts}-${rand}@sotally-test.invalid`;
}

/**
 * Unique slug generator for test isolation.
 */
export function testSlug(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 5);
  return `e2e-${ts}-${rand}`;
}

/**
 * Inject Zustand auth state into the browser so protected pages load
 * without going through the login UI.
 */
export async function injectAuth(
  page: import('@playwright/test').Page,
  token: string,
): Promise<void> {
  // First, fetch the user profile so we have a complete auth state
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let user = null;
  if (res.ok) {
    const body = await res.json();
    user = body?.data?.user || null;
  }

  const authPayload = JSON.stringify({
    state: {
      token,
      isAuthenticated: true,
      user,
    },
    version: 0,
  });

  // Set via addInitScript (runs before page JS on every navigation)
  await page.addInitScript((payload) => {
    localStorage.setItem('sotally-auth', payload);
  }, authPayload);
}
