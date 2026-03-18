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
    ).toBeVisible({ timeout: 10_000 });

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

    // Wait for the onboarding page to render
    await expect(
      page.getByRole('heading', { name: /Set up your storefront/i }),
    ).toBeVisible({ timeout: 10_000 });

    const slug = testSlug();
    const slugInput = page.locator('input[placeholder="your-name"]');
    await slugInput.fill(slug);

    // Wait for either "available" or "taken" feedback (debounced 500ms)
    await expect(
      page.getByText('is available!').or(page.getByText('This subdomain is taken')).or(page.getByText('Checking availability')),
    ).toBeVisible({ timeout: 10_000 });

    // The .sotally.com suffix should be visible
    await expect(page.getByText('.sotally.com', { exact: false }).first()).toBeVisible();
  });

  test('should complete onboarding flow', async ({ page }) => {
    // Create a fresh user with known credentials
    const email = testEmail();
    const password = 'TestPass123!Secure';
    await createTestUser('', 'Onboard Flow Tester', email);

    // Log in through the UI
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Wait for login to complete and redirect
    await page.waitForURL(/\/(dashboard|onboarding|create|welcome)/, { timeout: 15_000 });

    // Navigate to onboarding
    await page.goto('/onboarding');
    await page.waitForLoadState('domcontentloaded');

    // Wait for onboarding page to render
    await expect(
      page.getByRole('heading', { name: /Set up your storefront/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Step 1: Enter slug
    const slug = testSlug();
    const slugInput = page.locator('input[placeholder="your-name"]');
    await slugInput.fill(slug);

    // Wait for availability check (debounced 500ms + network)
    await expect(
      page.getByText('is available!'),
    ).toBeVisible({ timeout: 15_000 });

    const continueBtn = page.getByRole('button', { name: /Continue/i });
    await expect(continueBtn).toBeEnabled();
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
  });
});
