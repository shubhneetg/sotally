import { test, expect } from '@playwright/test';
import {
  createTestUser,
  testEmail,
  testSlug,
  injectAuth,
} from './helpers/api';

test.describe('Dashboard', () => {
  let token: string;

  test.beforeAll(async () => {
    const user = await createTestUser(
      testSlug(),
      'Dashboard Tester',
      testEmail(),
      'business',
    );
    token = user.token;
  });

  test.beforeEach(async ({ page }) => {
    await injectAuth(page, token);
  });

  test('should show dashboard with create CTA', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // "Create New App" button or "Create Your First App" CTA
    const createLink = page.getByRole('link', { name: /Create/i }).first();
    await expect(createLink).toBeVisible({ timeout: 10_000 });
  });

  test('should show apps list', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // "My Apps" heading
    await expect(
      page.getByRole('heading', { name: /My Apps/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Either app cards or "Create your first app" empty state
    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    const hasApps = await page
      .locator('a[href*="/studio/"]')
      .first()
      .isVisible()
      .catch(() => false);

    const hasEmpty = await page
      .getByText(/Create your first app/i)
      .isVisible()
      .catch(() => false);

    expect(hasApps || hasEmpty).toBe(true);
  });

  test('should have revenue, API, domains nav items', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Sidebar nav items
    const navLabels = ['Revenue', 'API', 'Domains'];

    for (const label of navLabels) {
      await expect(
        page.getByRole('link', { name: label, exact: true }),
      ).toBeVisible();
    }
  });
});
