import { test, expect } from '@playwright/test';
import {
  createTestUser,
  testEmail,
  testSlug,
  injectAuth,
} from './helpers/api';

test.describe('App Creation', () => {
  let token: string;

  test.beforeAll(async () => {
    const user = await createTestUser(
      testSlug(),
      'Creator Tester',
      testEmail(),
      'education',
    );
    token = user.token;
  });

  test.beforeEach(async ({ page }) => {
    await injectAuth(page, token);
  });

  test('should show create page with prompt input', async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('domcontentloaded');

    await expect(
      page.getByRole('heading', { name: /Create a new app/i }),
    ).toBeVisible();

    const promptArea = page.locator('#prompt');
    await expect(promptArea).toBeVisible();
    await expect(promptArea).toHaveAttribute(
      'placeholder',
      /Describe the app you want/i,
    );
  });

  test('should show niche selector dropdown', async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('domcontentloaded');

    const nicheSelect = page.locator('#niche');
    await expect(nicheSelect).toBeVisible();

    // Verify some options exist
    const options = nicheSelect.locator('option');
    await expect(options).not.toHaveCount(0);

    // Check a known niche
    await expect(
      nicheSelect.locator('option[value="wellness"]'),
    ).toHaveText('Wellness');
  });

  test('should redirect to studio after generation starts', async ({
    page,
  }) => {
    await page.goto('/create');
    await page.waitForLoadState('domcontentloaded');

    // Fill prompt
    await page.locator('#prompt').fill(
      'A simple flashcard quiz app for studying vocabulary',
    );
    await page.locator('#niche').selectOption('education');

    // Submit
    await page.getByRole('button', { name: /Generate App/i }).click();

    // Should redirect to /studio/{appId}
    await page.waitForURL('**/studio/**', { timeout: 30_000 });
    expect(page.url()).toContain('/studio/');
  });

  test('should show generation progress states', async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#prompt').fill(
      'A simple tip calculator for restaurants',
    );

    // Click generate and watch for status
    await page.getByRole('button', { name: /Generate App/i }).click();

    // After redirect, studio page should show status
    await page.waitForURL('**/studio/**', { timeout: 30_000 });

    // At least one status label should appear
    const statusLabels = [
      'Queued',
      'Parsing prompt',
      'Generating code',
      'Building app',
      'Deploying',
      'Done',
      'Generating your app',
    ];

    let foundStatus = false;
    for (const label of statusLabels) {
      const el = page.getByText(label, { exact: false }).first();
      if (await el.isVisible().catch(() => false)) {
        foundStatus = true;
        break;
      }
    }

    expect(foundStatus).toBe(true);
  });
});
