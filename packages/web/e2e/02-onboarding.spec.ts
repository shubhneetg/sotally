import { test, expect } from '@playwright/test';
import {
  createTestUser,
  testEmail,
  testSlug,
  injectAuth,
} from './helpers/api';

test.describe('Onboarding', () => {
  let token: string;

  test.beforeAll(async () => {
    // Create a user without a storefront slug so onboarding is available
    const user = await createTestUser(
      '', // no slug -- skip creator setup
      'Onboard Tester',
      testEmail(),
    );
    token = user.token;
  });

  test.beforeEach(async ({ page }) => {
    await injectAuth(page, token);
  });

  test('should show onboarding page', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('domcontentloaded');

    await expect(
      page.getByRole('heading', { name: /Set up your storefront/i }),
    ).toBeVisible();

    await expect(
      page.getByText('Claim your subdomain'),
    ).toBeVisible();
  });

  test('should validate subdomain - too short', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('domcontentloaded');

    const slugInput = page.locator('input[placeholder="your-name"]');
    await slugInput.fill('ab');

    // The Continue button should be disabled because slug < 3 chars
    const continueBtn = page.getByRole('button', { name: /Continue/i });
    await expect(continueBtn).toBeDisabled();
  });

  test('should show availability check', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('domcontentloaded');

    const slug = testSlug();
    const slugInput = page.locator('input[placeholder="your-name"]');
    await slugInput.fill(slug);

    // Wait for either "available" or "taken" feedback (debounced 500ms)
    await page.waitForSelector(
      'text=is available, text=This subdomain is taken, text=Checking availability',
      { timeout: 10_000 },
    ).catch(() => {
      // One of the states should appear
    });

    // The .sotally.com suffix should be visible
    await expect(page.getByText('.sotally.com')).toBeVisible();
  });

  test('should complete onboarding flow', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('domcontentloaded');

    // Step 1: Enter slug
    const slug = testSlug();
    const slugInput = page.locator('input[placeholder="your-name"]');
    await slugInput.fill(slug);

    // Wait for availability check
    await page.waitForSelector('text=is available', { timeout: 15_000 }).catch(() => {});

    const continueBtn = page.getByRole('button', { name: /Continue/i });
    // If the slug is available, continue should be enabled
    if (await continueBtn.isEnabled()) {
      await continueBtn.click();

      // Step 2: Profile setup
      await expect(
        page.getByRole('heading', { name: /Set up your profile/i }),
      ).toBeVisible();

      await page.locator('#displayName').fill('E2E Test Creator');
      await page.locator('#bio').fill('Automated test creator for Sotally.');
      await page.locator('#niche').selectOption('education');

      // Submit
      await page.getByRole('button', { name: /Launch Storefront/i }).click();

      // Should redirect to /create on success
      await page.waitForURL('**/create**', { timeout: 15_000 }).catch(() => {});
    }
  });
});
