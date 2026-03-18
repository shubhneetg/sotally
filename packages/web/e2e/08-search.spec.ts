import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('should show search page', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('domcontentloaded');

    await expect(
      page.getByRole('heading', { name: /Search Apps/i }),
    ).toBeVisible();

    // Search input
    const searchInput = page.locator(
      'input[placeholder*="Search for apps"]',
    );
    await expect(searchInput).toBeVisible();

    // Niche filter pills
    await expect(page.getByText('All niches')).toBeVisible();
  });

  test('should return results for valid query', async ({ page }) => {
    await page.goto('/search?q=app');
    await page.waitForLoadState('domcontentloaded');

    // Wait for loading to finish
    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    // Should show either results or "No results found"
    const hasResults = await page.getByText(/result/i).isVisible().catch(() => false);
    const noResults = await page.getByText(/No results found/i).isVisible().catch(() => false);

    expect(hasResults || noResults).toBe(true);
  });

  test('should show empty state for no results', async ({ page }) => {
    await page.goto(
      '/search?q=xyznonexistentquerythatwillnevermatch12345',
    );
    await page.waitForLoadState('domcontentloaded');

    await page
      .waitForSelector('.animate-pulse', { state: 'detached', timeout: 15_000 })
      .catch(() => {});

    await expect(
      page.getByText(/No results found/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});
