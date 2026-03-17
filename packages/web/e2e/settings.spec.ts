/**
 * Settings / Profile Tests
 *
 * Covers the settings page at /dashboard/settings.
 * Tests that the page renders all four settings sections,
 * the delete account confirmation modal works,
 * and the notification toggles are interactive.
 */

import { test, expect } from '@playwright/test';
import { registerViaApi, injectAuthState } from './helpers';

test.describe('Settings Page', () => {
  // Test 50: Settings page renders all five sections
  test('settings page renders Profile, Password, API Keys, Notifications, and Danger Zone sections', async ({ page }) => {
    const { token } = await registerViaApi(page);
    await injectAuthState(page, token);

    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    // Profile section
    await expect(page.getByRole('heading', { name: /^profile$/i })).toBeVisible({ timeout: 10_000 });

    // Change Password section
    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible();

    // API Keys section (title is "API Keys (BYOM)")
    await expect(page.getByRole('heading', { name: /api keys/i })).toBeVisible();

    // Notification Preferences section
    await expect(page.getByRole('heading', { name: /notification preferences/i })).toBeVisible();

    // Danger Zone section
    await expect(page.getByRole('heading', { name: /danger zone/i })).toBeVisible();
  });

  // Test 51: Clicking "Delete Account" opens the confirmation modal
  test('Delete Account button opens the confirmation modal with cancel option', async ({ page }) => {
    const { token } = await registerViaApi(page);
    await injectAuthState(page, token);

    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    // Click the Delete Account button
    const deleteBtn = page.getByRole('button', { name: /delete account/i }).first();
    await expect(deleteBtn).toBeVisible({ timeout: 10_000 });
    await deleteBtn.click();

    // Confirmation modal should appear
    await expect(page.getByText(/are you sure/i)).toBeVisible({ timeout: 5_000 });

    // Modal should explain the consequences
    await expect(
      page.getByText(/permanently delete your account/i)
    ).toBeVisible();

    // Cancel button should close the modal
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Modal should be gone
    await expect(page.getByText(/are you sure/i)).not.toBeVisible({ timeout: 3_000 });
  });

  // Test 52: Notification preference toggles are interactive
  test('notification preference toggles can be clicked to toggle their state', async ({ page }) => {
    const { token } = await registerViaApi(page);
    await injectAuthState(page, token);

    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    // The toggle is a <button role="switch"> element
    const switches = page.getByRole('switch');
    await expect(switches.first()).toBeVisible({ timeout: 10_000 });

    const switchCount = await switches.count();
    expect(switchCount).toBeGreaterThanOrEqual(3); // At least 3 notification toggles

    // The Marketing switch (3rd toggle, index 2) starts as off (aria-checked="false")
    const marketingSwitch = switches.nth(2);
    const initialState = await marketingSwitch.getAttribute('aria-checked');
    expect(initialState).toBe('false');

    // Click to toggle
    await marketingSwitch.click();

    // State should have changed
    const newState = await marketingSwitch.getAttribute('aria-checked');
    expect(newState).toBe('true');
  });
});
