/**
 * Credit System Tests
 *
 * Covers credit balance display, package listing, transaction history,
 * and the credits API endpoint.
 */

import { test, expect } from '@playwright/test';
import { registerViaApi, injectAuthState, randomName, randomEmail, TEST_PASSWORD } from './helpers';

const API_URL = 'https://sotally.com/api';

test.describe('Credit System', () => {
  // Test 36: New user receives 50 free credits on registration
  test('new user gets 50 free credits upon registration', async ({ page }) => {
    const name = randomName();
    const email = randomEmail();

    // Register via API
    const regResponse = await page.request.post(`${API_URL}/auth/register`, {
      data: { name, email, password: TEST_PASSWORD },
    });
    expect(regResponse.status()).toBe(201);

    const regBody = await regResponse.json();
    const token = (regBody.data || regBody).token;

    // Check balance
    const balanceResponse = await page.request.get(`${API_URL}/credits/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(balanceResponse.status()).toBe(200);

    const balanceBody = await balanceResponse.json();
    const balance = balanceBody.data?.balance ?? balanceBody.balance;
    expect(balance).toBeGreaterThanOrEqual(50);
  });

  // Test 37: GET /api/credits/balance without auth returns 401
  test('GET /api/credits/balance without auth token returns 401', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/credits/balance`);
    expect(response.status()).toBe(401);
  });

  // Test 38: GET /api/credits/packages returns credit packages with pricing
  test('GET /api/credits/packages returns available packages', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/credits/packages`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);

    const packages = body.data?.packages ?? body.data ?? body.packages;
    expect(Array.isArray(packages)).toBe(true);
    expect(packages.length).toBeGreaterThanOrEqual(1);

    // Each package should have price and credits fields
    const first = packages[0];
    expect(typeof first.price !== 'undefined' || typeof first.priceUsd !== 'undefined').toBe(true);
    expect(typeof first.credits !== 'undefined' || typeof first.amount !== 'undefined').toBe(true);
  });

  // Test 39: Credits page shows current balance and package cards
  test('dashboard credits page shows balance and buy credits packages', async ({ page }) => {
    const { name, email, token } = await registerViaApi(page);
    await injectAuthState(page, token, { name, email });

    await page.goto('/dashboard/credits');
    await page.waitForLoadState('networkidle');

    // Balance display
    await expect(page.getByText(/current balance/i)).toBeVisible({ timeout: 8_000 });

    // Package cards (Buy Credits section)
    await expect(page.getByText(/buy credits/i)).toBeVisible({ timeout: 8_000 });

    // At least one package card with a Buy button
    await expect(
      page.getByRole('button', { name: /buy/i }).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  // Test 40: Credits page shows "Most Popular" badge on the popular package
  test('credits page shows the Most Popular badge on the popular package', async ({ page }) => {
    const { name, email, token } = await registerViaApi(page);
    await injectAuthState(page, token, { name, email });

    await page.goto('/dashboard/credits');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText(/most popular/i)
    ).toBeVisible({ timeout: 8_000 });
  });
});
