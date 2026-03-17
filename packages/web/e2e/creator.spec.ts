/**
 * Creator Studio Tests
 *
 * Covers the creator dashboard at /creator and the tool creation flow at /creator/tools/new.
 * Tests that the creator dashboard loads with the correct stats UI,
 * the "Create New Tool" CTA works, and the multi-step tool builder renders.
 *
 * The creator layout checks isAuthenticated from Zustand synchronously.
 * Zustand persist only saves { token }, so isAuthenticated defaults to false
 * after full page navigation. We fix this by manually storing { token, isAuthenticated: true }
 * in localStorage before navigating — Zustand's shallow merge on rehydration
 * picks up both fields.
 */

import { test, expect } from '@playwright/test';
import { registerViaApi, waitForLoading, randomName, randomEmail, TEST_PASSWORD } from './helpers';

/**
 * Navigate to a creator page with working auth.
 * Injects full auth state (including isAuthenticated) into localStorage,
 * then navigates so Zustand rehydrates with isAuthenticated=true.
 */
async function navigateToCreatorPage(page: import('@playwright/test').Page, path: string) {
  const name = randomName();
  const email = randomEmail();
  const { token } = await registerViaApi(page, name, email, TEST_PASSWORD);

  // Navigate to any page first to have a browsing context for localStorage
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Inject auth state with BOTH token AND isAuthenticated into localStorage.
  // Zustand's persist middleware does a shallow merge on rehydration:
  //   merge(initialState, storedState) => { ...initialState, ...storedState }
  // So storing isAuthenticated: true here will override the default false.
  await page.evaluate(
    ({ token }) => {
      localStorage.setItem(
        'sotally-auth',
        JSON.stringify({
          state: {
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            user: null,
          },
          version: 0,
        })
      );
    },
    { token }
  );

  // Now navigate to the creator page — Zustand will rehydrate and merge
  // { token, isAuthenticated: true } with the initial state.
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  await waitForLoading(page);
}

test.describe('Creator Studio', () => {
  // Test 45: Creator dashboard loads with stats cards for authenticated user
  test('creator dashboard shows four stat cards for authenticated user', async ({ page }) => {
    await navigateToCreatorPage(page, '/creator');

    // Four metric cards: Total Tools, Total Runs (30d), Earnings (30d), Avg Rating
    // Use heading role to avoid matching sidebar nav links
    await expect(page.getByRole('heading', { name: /total tools/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /total runs/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('heading', { name: /earnings/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('heading', { name: /avg rating/i })).toBeVisible({ timeout: 8_000 });
  });

  // Test 46: Creator dashboard has a "Create New Tool" button
  test('creator dashboard shows Create New Tool CTA linking to /creator/tools/new', async ({ page }) => {
    await navigateToCreatorPage(page, '/creator');

    const createCta = page.locator('a[href="/creator/tools/new"]');
    await expect(createCta.first()).toBeVisible({ timeout: 15_000 });
  });

  // Test 47: New tool builder page renders the multi-step form with Step 1 active
  test('new tool creation page renders multi-step form with Basics step', async ({ page }) => {
    await navigateToCreatorPage(page, '/creator/tools/new');

    await expect(page.getByText(/basics/i).first()).toBeVisible({ timeout: 15_000 });
    // Labels don't use htmlFor, so use text matching for field labels
    await expect(page.getByText(/tool name/i).first()).toBeVisible();
    await expect(page.getByText(/^slug$/i)).toBeVisible();
  });

  // Test 48: New tool form step 1 validates required fields before advancing
  test('new tool form step 1 shows validation when required fields are empty', async ({ page }) => {
    await navigateToCreatorPage(page, '/creator/tools/new');

    const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
    await expect(nextBtn).toBeVisible({ timeout: 15_000 });

    // The Next button is disabled when required fields are empty.
    // This IS the validation behavior — the button stays disabled.
    await expect(nextBtn).toBeDisabled();

    // We should still be on Step 1 (Basics)
    await expect(page.getByText(/basics/i).first()).toBeVisible();
  });

  // Test 49: Creator tools list page is accessible
  test('creator tools list page renders for authenticated user', async ({ page }) => {
    await navigateToCreatorPage(page, '/creator/tools');

    await expect(page).toHaveURL(/.*creator\/tools/);
    const content = page.locator('h1, h2, [class*="text-primary"]').first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });
});
