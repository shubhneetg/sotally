import { Page, expect } from '@playwright/test';

const BASE_URL = 'https://sotally.com';
const API_URL = `${BASE_URL}/api`;

// ─── Random Data Generators ──────────────────────────────────────────────────

/**
 * Generates a unique email address for test isolation.
 * Uses a timestamp + random suffix to avoid collisions between
 * parallel test runs.
 */
export function randomEmail(): string {
  const timestamp = Date.now();
  const suffix = Math.random().toString(36).slice(2, 7);
  return `test-${timestamp}-${suffix}@sotally-test.invalid`;
}

/**
 * Generates a random name for test users.
 */
export function randomName(): string {
  const firstNames = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry'];
  const lastNames = ['Smith', 'Jones', 'Brown', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Clark'];
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

/**
 * Default strong password used for all test accounts.
 * All test accounts use this same password for simplicity.
 */
export const TEST_PASSWORD = 'TestPass123!Secure';

// ─── API Helpers ─────────────────────────────────────────────────────────────

/**
 * Registers a new user via the API directly (bypasses UI).
 * Returns the auth token for subsequent authenticated requests.
 */
export async function getAuthToken(
  page: Page,
  email: string,
  password: string = TEST_PASSWORD
): Promise<string> {
  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} - ${await response.text()}`);
  }

  const body = await response.json();
  const token = body?.data?.token || body?.token;

  if (!token) {
    throw new Error(`No token returned from login. Response: ${JSON.stringify(body)}`);
  }

  return token as string;
}

/**
 * Registers a new user via API and returns { email, token }.
 * Useful when you need a fresh user for a test without going through the UI.
 */
export async function registerViaApi(
  page: Page,
  name: string = randomName(),
  email: string = randomEmail(),
  password: string = TEST_PASSWORD
): Promise<{ name: string; email: string; token: string }> {
  const response = await page.request.post(`${API_URL}/auth/register`, {
    data: { name, email, password },
  });

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Registration failed: ${response.status()} - ${text}`);
  }

  const body = await response.json();
  const token = body?.data?.token || body?.token;

  if (!token) {
    throw new Error(`No token returned from registration. Response: ${JSON.stringify(body)}`);
  }

  return { name, email, token: token as string };
}

// ─── UI Flow Helpers ─────────────────────────────────────────────────────────

/**
 * Registers a new user through the UI registration form.
 * Fills in name, email, and password fields and submits.
 * Waits for the success message before returning.
 */
export async function registerUser(
  page: Page,
  name: string,
  email: string,
  password: string = TEST_PASSWORD
): Promise<void> {
  await page.goto('/register');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('#name', name);
  await page.fill('#email', email);
  await page.fill('#password', password);

  await page.click('button[type="submit"]');

  // Wait for either success message or redirect
  await Promise.race([
    page.waitForSelector('text=Account created!', { timeout: 15_000 }),
    page.waitForURL('**/tools', { timeout: 15_000 }),
    page.waitForURL('**/dashboard', { timeout: 15_000 }),
  ]);
}

/**
 * Logs in a user through the UI login form.
 * Waits for redirect to dashboard before returning.
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string = TEST_PASSWORD
): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('#email', email);
  await page.fill('#password', password);

  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

/**
 * Sets authentication state by injecting auth token and user data
 * directly into the browser's localStorage/zustand store via JS.
 * This is faster than going through the login UI for tests that
 * need authentication as a precondition rather than as the subject.
 */
export async function injectAuthState(
  page: Page,
  token: string,
  _user?: { name: string; email: string }
): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Inject into localStorage following Zustand's persist format.
  // Although the store only partializes { token }, Zustand's rehydration
  // will merge whatever we put into localStorage. We inject the full auth
  // state so that isAuthenticated is true immediately on page load,
  // preventing premature redirects to /login on dashboard pages.
  // The header's loadUser() will then fetch the real user profile.
  await page.evaluate(
    ({ token }) => {
      const storeKey = 'sotally-auth';
      const state = {
        state: {
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          user: null,
        },
        version: 0,
      };
      localStorage.setItem(storeKey, JSON.stringify(state));
    },
    { token }
  );
}

// ─── Assertion Helpers ────────────────────────────────────────────────────────

/**
 * Asserts that the API health endpoint returns a 200 with success=true.
 */
export async function assertApiHealthy(page: Page): Promise<void> {
  const response = await page.request.get(`${API_URL}/health`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status ?? body.success).toBeTruthy();
}

/**
 * Waits for a network response matching the given URL pattern.
 * Returns the parsed JSON body.
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>
): Promise<unknown> {
  const [response] = await Promise.all([
    page.waitForResponse(urlPattern),
    action(),
  ]);
  return response.json();
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * A known tool slug that is expected to exist in the live marketplace.
 * Used across multiple tests as a stable fixture.
 */
export const KNOWN_TOOL_SLUG = 'image-bg-remover';

/**
 * Known tool slugs to use in tests. These match the 9 seeded tools.
 */
export const TOOL_SLUGS = [
  'image-bg-remover',
  'pdf-invoice-generator',
  'seo-meta-analyzer',
];
