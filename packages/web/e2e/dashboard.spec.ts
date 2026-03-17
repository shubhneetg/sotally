/**
 * Dashboard Tests
 *
 * Covers the main dashboard at /dashboard and the history page.
 * Tests authentication gate, credit balance card,
 * recent executions list, and redirect behavior.
 */

import { test, expect } from '@playwright/test';
import { registerViaApi, injectAuthState } from './helpers';

test.describe('Dashboard', () => {
  // Test 41: Unauthenticated user visiting /dashboard is redirected to login
  test('unauthenticated visit to /dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to /login with a redirect param
    await page.waitForURL(/.*login/, { timeout: 8_000 });
    await expect(page).toHaveURL(/.*login/);
  });

  // Test 42: Authenticated user sees the dashboard with credit balance card
  test('authenticated user sees dashboard with credit balance and welcome message', async ({ page }) => {
    const { token } = await registerViaApi(page);
    await injectAuthState(page, token);

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Welcome heading: "Welcome back, {firstName}" or just "Dashboard"
    await expect(
      page.getByRole('heading', { name: /welcome back|dashboard/i })
    ).toBeVisible({ timeout: 10_000 });

    // Credit balance card
    await expect(page.getByText(/your credit balance/i)).toBeVisible({ timeout: 8_000 });

    // Buy Credits link
    await expect(
      page.getByRole('link', { name: /buy credits/i })
    ).toBeVisible();
  });

  // Test 43: Dashboard shows empty state for executions on a new account
  test('new user dashboard shows no executions empty state', async ({ page }) => {
    const { token } = await registerViaApi(page);
    await injectAuthState(page, token);

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Wait for loading state to resolve
    await page.waitForSelector('.animate-pulse', { state: 'detached', timeout: 10_000 }).catch(() => {});

    // New account should show "No executions yet."
    await expect(
      page.getByText(/no executions yet/i)
    ).toBeVisible({ timeout: 10_000 });

    // Empty state should have a link to browse tools
    await expect(
      page.getByRole('link', { name: /browse tools to get started/i })
    ).toBeVisible();
  });

  // Test 44: Dashboard history page is accessible and shows the right heading
  test('dashboard history page loads for authenticated user', async ({ page }) => {
    const { token } = await registerViaApi(page);
    await injectAuthState(page, token);

    await page.goto('/dashboard/history');
    await page.waitForLoadState('domcontentloaded');

    // Should not redirect away — history page should load
    await expect(page).toHaveURL(/.*dashboard\/history/);
    // Page should render the "Execution History" heading
    await expect(
      page.getByRole('heading', { name: /execution history/i })
    ).toBeVisible({ timeout: 10_000 });
  });
});
