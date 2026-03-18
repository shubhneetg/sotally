import { test, expect } from '@playwright/test';

test.describe('Pricing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should show 3 pricing tiers', async ({ page }) => {
    // Three tier names
    await expect(page.getByText('Free', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Pro', { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText('Business', { exact: true }).first(),
    ).toBeVisible();
  });

  test('should show correct prices (Free, $19, $49)', async ({ page }) => {
    // Free tier shows "Free" as the price
    const freePriceLocator = page.locator(
      'span.text-4xl:has-text("Free")',
    );
    await expect(freePriceLocator).toBeVisible();

    // Pro: $19
    await expect(page.getByText('$19')).toBeVisible();

    // Business: $49
    await expect(page.getByText('$49')).toBeVisible();
  });

  test('should show feature comparison', async ({ page }) => {
    // Check a few features from each tier
    const features = [
      '3 apps',
      '25 apps',
      'Unlimited apps',
      'Custom domain',
      'API access',
    ];

    for (const feature of features) {
      await expect(page.getByText(feature).first()).toBeVisible();
    }
  });
});
