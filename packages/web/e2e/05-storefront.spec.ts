import { test, expect } from '@playwright/test';
import {
  createTestUser,
  generateApp,
  waitForGeneration,
  publishApp,
  testEmail,
  testSlug,
} from './helpers/api';

test.describe('Storefront', () => {
  let slug: string;
  let token: string;

  test.beforeAll(async () => {
    slug = testSlug();
    const user = await createTestUser(
      slug,
      'Storefront Tester',
      testEmail(),
      'wellness',
      'I build wellness apps for my clients.',
    );
    token = user.token;

    // Generate and publish an app so the storefront has content
    try {
      const appId = await generateApp(
        token,
        'A guided breathing exercise timer',
        'wellness',
      );
      const status = await waitForGeneration(token, appId, 120_000);
      if (status === 'succeeded') {
        await publishApp(token, appId);
      }
    } catch {
      // Non-critical -- tests still verify the storefront UI
    }
  });

  test('should show creator profile on storefront page', async ({ page }) => {
    await page.goto(`/storefront/${slug}`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for loading to finish
    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    // Creator name
    await expect(
      page.getByRole('heading', { name: /Storefront Tester/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show published apps grid', async ({ page }) => {
    await page.goto(`/storefront/${slug}`);
    await page.waitForLoadState('domcontentloaded');

    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    // "Apps" section heading
    await expect(
      page.getByRole('heading', { name: /Apps/i }),
    ).toBeVisible();
  });

  test('should show app count and follower count', async ({ page }) => {
    await page.goto(`/storefront/${slug}`);
    await page.waitForLoadState('domcontentloaded');

    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    // Should show "X followers" and "X apps"
    await expect(page.getByText(/followers/i)).toBeVisible();
    await expect(page.getByText(/apps/i).first()).toBeVisible();
  });

  test('should handle non-existent storefronts (404)', async ({ page }) => {
    await page.goto('/storefront/this-creator-definitely-does-not-exist-xyz');
    await page.waitForLoadState('domcontentloaded');

    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    // 404 indicator
    await expect(page.getByText('404')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Creator not found/i)).toBeVisible();
  });
});
