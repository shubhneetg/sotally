import { test, expect } from '@playwright/test';

test.describe('Explore', () => {
  test('should show explore page with niche grid', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('domcontentloaded');

    await expect(
      page.getByRole('heading', { name: /Explore Apps/i }),
    ).toBeVisible();

    // Niche cards should be present
    const nicheNames = [
      'Wellness',
      'Fitness',
      'Education',
      'Finance',
      'Nutrition',
      'Business',
    ];

    for (const name of nicheNames) {
      await expect(
        page.getByRole('heading', { name, exact: true }).or(
          page.getByText(name, { exact: true }),
        ).first(),
      ).toBeVisible();
    }
  });

  test('should show apps when clicking a niche', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('domcontentloaded');

    // Click on the Wellness niche link
    const wellnessLink = page.getByRole('link', { name: /Wellness/i }).first();
    await wellnessLink.click();

    await page.waitForURL('**/explore/wellness', { timeout: 10_000 });

    // Should show niche landing content
    await expect(page.locator('h1').first()).toBeVisible();

    // "Published apps" section
    await expect(
      page.getByText(/Published apps/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should show niche landing page content', async ({ page }) => {
    await page.goto('/explore/education');
    await page.waitForLoadState('domcontentloaded');

    // Heading should reference education
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    // "All niches" back link
    await expect(
      page.getByRole('link', { name: /All niches/i }),
    ).toBeVisible();

    // CTA to create
    await expect(
      page.getByRole('link', { name: /Create/i }).first(),
    ).toBeVisible();
  });
});
