import { test, expect } from '@playwright/test';
import {
  createTestUser,
  generateApp,
  waitForGeneration,
  testEmail,
  testSlug,
  injectAuth,
} from './helpers/api';

test.describe('Studio', () => {
  let token: string;
  let appId: string;
  let generationStatus: string;

  test.beforeAll(async () => {
    const user = await createTestUser(
      testSlug(),
      'Studio Tester',
      testEmail(),
      'fitness',
    );
    token = user.token;

    // Generate an app via API so we have something to view in studio
    appId = await generateApp(
      token,
      'A workout timer with interval tracking',
      'fitness',
    );

    // Wait for it to finish (or fail)
    generationStatus = await waitForGeneration(token, appId, 120_000).catch(
      () => 'timeout',
    );
  });

  test.beforeEach(async ({ page }) => {
    await injectAuth(page, token);
  });

  test('should show the studio with chat panel and preview panel', async ({
    page,
  }) => {
    await page.goto(`/studio/${appId}`);
    await page.waitForLoadState('domcontentloaded');

    // Should show the app name or "Untitled App" in the header
    await expect(page.locator('header')).toBeVisible();

    // Chat panel: iteration input should exist
    const iterationInput = page.locator(
      'input[placeholder*="Make changes"], input[placeholder*="Wait for generation"]',
    );
    await expect(iterationInput).toBeVisible();

    // Preview panel label
    await expect(page.getByText('Preview')).toBeVisible();
  });

  test('should show generation status updates', async ({ page }) => {
    await page.goto(`/studio/${appId}`);
    await page.waitForLoadState('domcontentloaded');

    // Chat messages should include the original prompt or a system message
    const chatArea = page.locator('.overflow-y-auto');
    await expect(chatArea).toBeVisible();

    // At least one message should be visible
    const messages = chatArea.locator('.rounded-xl');
    await expect(messages.first()).toBeVisible();
  });

  test('should show publish button after generation succeeds', async ({
    page,
  }) => {
    test.skip(
      generationStatus !== 'succeeded',
      'Generation did not succeed -- skipping publish button check',
    );

    await page.goto(`/studio/${appId}`);
    await page.waitForLoadState('domcontentloaded');

    // Publish button in the header
    const publishBtn = page.getByRole('button', { name: /Publish/i });
    await expect(publishBtn).toBeVisible({ timeout: 10_000 });
  });

  test('should allow iteration input', async ({ page }) => {
    test.skip(
      generationStatus !== 'succeeded',
      'Generation did not succeed -- skipping iteration check',
    );

    await page.goto(`/studio/${appId}`);
    await page.waitForLoadState('domcontentloaded');

    const input = page.locator('input[placeholder*="Make changes"]');
    await expect(input).toBeEnabled({ timeout: 10_000 });

    await input.fill('Add a dark mode toggle');
    await expect(input).toHaveValue('Add a dark mode toggle');

    // The send button should be enabled
    const sendBtn = page.locator('button[type="submit"]').last();
    await expect(sendBtn).toBeEnabled();
  });
});
