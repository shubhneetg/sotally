/**
 * Authentication Tests
 *
 * Covers registration, login, and logout flows.
 * Each test uses a unique email to avoid conflicts.
 * Both UI flows and API-level validations are tested.
 */

import { test, expect } from '@playwright/test';
import { randomEmail, randomName, TEST_PASSWORD, registerViaApi, loginUser } from './helpers';

const API_URL = 'https://sotally.com/api';

test.describe('Registration', () => {
  // Test 6: Successful registration via UI shows success message
  test('successful registration shows success message and redirects', async ({ page }) => {
    const name = randomName();
    const email = randomEmail();

    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.fill('#name', name);
    await page.fill('#email', email);
    await page.fill('#password', TEST_PASSWORD);

    await page.click('button[type="submit"]');

    // Should show the success message
    await expect(
      page.getByText(/account created/i)
    ).toBeVisible({ timeout: 10_000 });

    // Should eventually redirect to /tools
    await page.waitForURL('**/tools', { timeout: 15_000 });
  });

  // Test 7: Registration with duplicate email shows an error
  test('registration with existing email shows error message', async ({ page }) => {
    const name = randomName();
    const email = randomEmail();

    // Register via API first to create the account
    await page.request.post(`${API_URL}/auth/register`, {
      data: { name, email, password: TEST_PASSWORD },
    });

    // Now attempt to register again via UI with the same email
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.fill('#name', name);
    await page.fill('#email', email);
    await page.fill('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should show an error - email already in use
    await expect(
      page.locator('[class*="destructive"]').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  // Test 8: Registration form validates required fields
  test('registration form requires all mandatory fields', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Submit without filling any fields
    await page.click('button[type="submit"]');

    // HTML5 required validation prevents submission;
    // the page should still be on /register
    await expect(page).toHaveURL(/.*register/);
  });

  // Test 9: Registration page has a link to login page
  test('registration page links to the login page', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    const loginLink = page.getByRole('link', { name: /log in/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Login', () => {
  // Test 10: Successful login via UI redirects to dashboard
  test('successful login redirects to the dashboard', async ({ page }) => {
    // Register a fresh account first
    const name = randomName();
    const email = randomEmail();
    await page.request.post(`${API_URL}/auth/register`, {
      data: { name, email, password: TEST_PASSWORD },
    });

    await loginUser(page, email, TEST_PASSWORD);

    await expect(page).toHaveURL(/.*dashboard/);
    // Dashboard should show welcome message
    await expect(page.getByRole('heading', { name: /welcome back|dashboard/i })).toBeVisible();
  });

  // Test 11: Login with wrong password shows error
  test('login with incorrect password shows error message', async ({ page }) => {
    const name = randomName();
    const email = randomEmail();
    await page.request.post(`${API_URL}/auth/register`, {
      data: { name, email, password: TEST_PASSWORD },
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#email', email);
    await page.fill('#password', 'WrongPassword999!');
    await page.click('button[type="submit"]');

    // Should show error, not redirect
    await expect(
      page.locator('[class*="destructive"]').first()
    ).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL(/.*login/);
  });

  // Test 12: Login with non-existent email shows error
  test('login with non-existent email shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#email', 'nobody-exists@sotally-test.invalid');
    await page.fill('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(
      page.locator('[class*="destructive"]').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  // Test 13: Login page has a link to the registration page
  test('login page links to the registration page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const signupLink = page.getByRole('link', { name: /sign up/i });
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await page.waitForURL('**/register');
    await expect(page).toHaveURL(/.*register/);
  });
});

test.describe('API Auth Endpoints', () => {
  // Test 14: POST /api/auth/register returns token on success
  test('POST /api/auth/register returns token and user on success', async ({ page }) => {
    const name = randomName();
    const email = randomEmail();

    const response = await page.request.post(`${API_URL}/auth/register`, {
      data: { name, email, password: TEST_PASSWORD },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);

    const data = body.data || body;
    expect(data.token).toBeTruthy();
    expect(data.user?.email).toBe(email);
    expect(data.user?.name).toBe(name);
  });

  // Test 15: POST /api/auth/login returns token on success
  test('POST /api/auth/login returns token on success', async ({ page }) => {
    // Register first
    const { email } = await registerViaApi(page);

    const response = await page.request.post(`${API_URL}/auth/login`, {
      data: { email, password: TEST_PASSWORD },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);

    const data = body.data || body;
    expect(data.token).toBeTruthy();
  });
});
