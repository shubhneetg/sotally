import { test, expect } from '@playwright/test';

test.describe('Social / Feed', () => {
  test('should show feed page', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForLoadState('domcontentloaded');

    // Not logged in, should see "Trending Apps"
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    const headingText = await heading.textContent();
    expect(
      headingText?.includes('Trending') || headingText?.includes('Feed'),
    ).toBe(true);
  });

  test('should show trending apps when not logged in', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForLoadState('domcontentloaded');

    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    // Should show either app cards or "No apps yet" empty state
    const hasApps = await page
      .locator('[class*="rounded-xl"][class*="border"]')
      .first()
      .isVisible()
      .catch(() => false);

    const hasEmpty = await page
      .getByText(/No apps yet/i)
      .isVisible()
      .catch(() => false);

    expect(hasApps || hasEmpty).toBe(true);
  });
});
