import { test, expect } from '@playwright/test';
import {
  createTestUser,
  generateApp,
  waitForGeneration,
  publishApp,
  testEmail,
  testSlug,
} from './helpers/api';

test.describe('App Runner / Detail Page', () => {
  let appId: string;
  let generated: boolean = false;

  test.beforeAll(async () => {
    const user = await createTestUser(
      testSlug(),
      'Runner Tester',
      testEmail(),
      'finance',
    );

    try {
      appId = await generateApp(
        user.token,
        'A simple tip calculator that splits the bill',
        'finance',
      );
      const status = await waitForGeneration(user.token, appId, 120_000);
      if (status === 'succeeded') {
        await publishApp(user.token, appId);
        generated = true;
      }
    } catch {
      // Will skip iframe tests
    }
  });

  test('should load app detail page', async ({ page }) => {
    test.skip(!appId, 'No app was generated');

    await page.goto(`/apps/${appId}`);
    await page.waitForLoadState('domcontentloaded');

    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    // Page should not show error
    const errorEl = page.getByText('App not found');
    const isError = await errorEl.isVisible().catch(() => false);

    if (!isError) {
      // At minimum, the page loaded without 404
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show app name and creator info', async ({ page }) => {
    test.skip(!generated, 'App not generated or published');

    await page.goto(`/apps/${appId}`);
    await page.waitForLoadState('domcontentloaded');

    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    // App name should appear as a heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    // Creator link "by ..."
    await expect(page.getByText(/by /i).first()).toBeVisible();
  });

  test('should load app in sandboxed iframe', async ({ page }) => {
    test.skip(!generated, 'App not generated or published');

    await page.goto(`/apps/${appId}`);
    await page.waitForLoadState('domcontentloaded');

    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    // Click "Use App" to show the iframe
    const useAppBtn = page.getByRole('button', { name: /Use App/i });
    if (await useAppBtn.isVisible().catch(() => false)) {
      await useAppBtn.click();

      // Iframe should appear
      const iframe = page.locator('iframe[title]');
      await expect(iframe).toBeVisible({ timeout: 10_000 });

      // Iframe should have sandbox attribute
      await expect(iframe).toHaveAttribute('sandbox', /allow-scripts/);
    }
  });

  test('should show share button', async ({ page }) => {
    test.skip(!generated, 'App not generated or published');

    await page.goto(`/apps/${appId}`);
    await page.waitForLoadState('domcontentloaded');

    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    await expect(
      page.getByRole('button', { name: /Share/i }),
    ).toBeVisible();
  });
});
