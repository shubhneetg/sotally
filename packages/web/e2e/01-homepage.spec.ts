import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Sotally/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show the hero section with prompt input', async ({ page }) => {
    // Hero headline
    await expect(
      page.getByRole('heading', { name: /Turn words into/i }),
    ).toBeVisible();

    // Tagline
    await expect(
      page.getByText('Describe it. We build it. Under 5 minutes.'),
    ).toBeVisible();

    // Prompt textarea
    const textarea = page.locator(
      'textarea[placeholder*="Describe the app you want"]',
    );
    await expect(textarea).toBeVisible();

    // Create button
    await expect(
      page.locator('button:has-text("Create")').first(),
    ).toBeVisible();
  });

  test('should show niche category grid', async ({ page }) => {
    // Section heading
    await expect(
      page.getByRole('heading', { name: /Apps for every niche/i }),
    ).toBeVisible();

    // Verify at least a few niches are rendered
    const niches = ['Wellness', 'Fitness', 'Education', 'Finance'];
    for (const niche of niches) {
      await expect(page.getByText(niche, { exact: true }).first()).toBeVisible();
    }
  });

  test('should have working navigation links', async ({ page }) => {
    // "or browse existing apps" link goes to /explore
    const exploreLink = page.getByRole('link', {
      name: /browse existing apps/i,
    });
    await expect(exploreLink).toBeVisible();
    await expect(exploreLink).toHaveAttribute('href', '/explore');

    // Explore all niches link
    const allNichesLink = page
      .getByRole('link', { name: /Explore all niches/i })
      .first();
    await expect(allNichesLink).toBeVisible();
    await expect(allNichesLink).toHaveAttribute('href', '/explore');

    // Start Creating CTA
    const startCreatingLink = page.getByRole('link', {
      name: /Start Creating/i,
    });
    await expect(startCreatingLink).toBeVisible();
    await expect(startCreatingLink).toHaveAttribute('href', '/create');
  });
});
