/**
 * Creator Studio Tests
 *
 * Covers the creator dashboard at /creator and the tool creation flow at /creator/tools/new.
 * Tests that the creator dashboard loads with the correct stats UI,
 * the "Create New Tool" CTA works, and the multi-step tool builder renders.
 */

import { test, expect } from '@playwright/test';
import { registerViaApi, injectAuthState } from './helpers';

test.describe('Creator Studio', () => {
  // Test 45: Creator dashboard loads with stats cards for authenticated user
  test('creator dashboard shows four stat cards for authenticated user', async ({ page }) => {
    const { name, email, token } = await registerViaApi(page);
    await injectAuthState(page, token, { name, email });

    await page.goto('/creator');
    await page.waitForLoadState('networkidle');

    // Wait for loading skeleton to finish
    await page.waitForSelector('.animate-pulse', { state: 'detached', timeout: 10_000 }).catch(() => {});

    // Four metric cards: Total Tools, Total Runs, Earnings, Avg Rating
    await expect(page.getByText(/total tools/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/total runs/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/earnings/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/avg rating/i)).toBeVisible({ timeout: 8_000 });
  });

  // Test 46: Creator dashboard has a "Create New Tool" button
  test('creator dashboard shows Create New Tool CTA linking to /creator/tools/new', async ({ page }) => {
    const { name, email, token } = await registerViaApi(page);
    await injectAuthState(page, token, { name, email });

    await page.goto('/creator');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-pulse', { state: 'detached', timeout: 10_000 }).catch(() => {});

    const createBtn = page.getByRole('link', { name: /create new tool/i });
    await expect(createBtn).toBeVisible({ timeout: 8_000 });
    await expect(createBtn).toHaveAttribute('href', '/creator/tools/new');
  });

  // Test 47: New tool builder page renders the multi-step form with Step 1 active
  test('new tool creation page renders multi-step form with Basics step', async ({ page }) => {
    const { name, email, token } = await registerViaApi(page);
    await injectAuthState(page, token, { name, email });

    await page.goto('/creator/tools/new');
    await page.waitForLoadState('networkidle');

    // Step 1: Basics should be visible and active
    await expect(page.getByText(/basics/i).first()).toBeVisible({ timeout: 8_000 });

    // Tool name field
    await expect(page.getByLabel(/tool name/i)).toBeVisible();

    // Slug field
    await expect(page.getByLabel(/slug/i)).toBeVisible();
  });

  // Test 48: New tool form step 1 validates required fields before advancing
  test('new tool form step 1 shows validation when required fields are empty', async ({ page }) => {
    const { name, email, token } = await registerViaApi(page);
    await injectAuthState(page, token, { name, email });

    await page.goto('/creator/tools/new');
    await page.waitForLoadState('networkidle');

    // Click Next without filling required fields
    const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
    await expect(nextBtn).toBeVisible({ timeout: 8_000 });
    await nextBtn.click();

    // Should either show validation errors or remain on Step 1
    // Step 1 (Basics) heading should still be visible
    await expect(page.getByText(/basics/i).first()).toBeVisible();
  });

  // Test 49: Creator tools list page is accessible and links back to dashboard
  test('creator tools list page renders for authenticated user', async ({ page }) => {
    const { name, email, token } = await registerViaApi(page);
    await injectAuthState(page, token, { name, email });

    await page.goto('/creator/tools');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-pulse', { state: 'detached', timeout: 10_000 }).catch(() => {});

    // Should be on the right page
    await expect(page).toHaveURL(/.*creator\/tools/);

    // Should show a heading or empty state, not a blank/error page
    const content = page.locator('h1, h2, [class*="text-primary"]').first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });
});
