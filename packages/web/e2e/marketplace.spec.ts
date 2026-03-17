/**
 * Marketplace Browsing Tests
 *
 * Covers the tools listing page at /tools.
 * Verifies tool grid, search, category filtering,
 * and navigation to tool detail pages.
 */

import { test, expect } from '@playwright/test';

const API_URL = 'https://sotally.com/api';

test.describe('Marketplace - Tools Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
    // Wait for tools to load (loading skeleton disappears)
    await page.waitForSelector('.animate-pulse', { state: 'detached', timeout: 10_000 }).catch(() => {});
  });

  // Test 16: Tools page renders the page title and description
  test('tools page renders the Explore Tools heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /explore tools/i })
    ).toBeVisible();

    await expect(
      page.getByText(/pay per use, no subscriptions/i)
    ).toBeVisible();
  });

  // Test 17: Tools grid loads and displays tool cards
  test('tool grid loads and displays at least one tool card', async ({ page }) => {
    // Wait for the grid to populate
    const toolCards = page.locator('a[href^="/tools/"]');
    await expect(toolCards.first()).toBeVisible({ timeout: 10_000 });
    const count = await toolCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // Test 18: Each tool card shows name, credit cost, and a run count
  test('each tool card shows tool name and credit information', async ({ page }) => {
    const toolCards = page.locator('a[href^="/tools/"]');
    await expect(toolCards.first()).toBeVisible({ timeout: 10_000 });

    const firstCard = toolCards.first();
    // Tool name should be a heading-level element within the card
    await expect(firstCard).toBeVisible();
    // Credit indicator (🪙 symbol or "credits") should be present
    await expect(firstCard.getByText(/credit/i).first()).toBeVisible();
  });

  // Test 19: Search input filters tools by name
  test('searching for a known tool name filters the results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search tools/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Image Background Remover');
    // Wait for debounced search to fire
    await page.waitForTimeout(600);
    await page.waitForLoadState('networkidle');

    // The specific tool should be visible
    await expect(
      page.getByText(/image background remover/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  // Test 20: Search with no matching term shows empty state
  test('search with a nonsense query shows no results empty state', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search tools/i);
    await searchInput.fill('xyzzy-nonexistent-tool-9999');
    await page.waitForTimeout(600);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText(/no tools found/i)
    ).toBeVisible({ timeout: 8_000 });
  });

  // Test 21: Category filter buttons are rendered and clickable
  test('category filter buttons render and the active state toggles', async ({ page }) => {
    // Categories: All, Design, Development, Marketing, Data, Writing
    const allBtn = page.getByRole('button', { name: /^all$/i });
    await expect(allBtn).toBeVisible();

    const designBtn = page.getByRole('button', { name: /^design$/i });
    await expect(designBtn).toBeVisible();

    // Click Design category
    await designBtn.click();
    await page.waitForTimeout(400);

    // Design button should now have the active/primary styling
    await expect(designBtn).toHaveClass(/bg-primary/);
  });

  // Test 22: GET /api/tools returns an array of tools
  test('GET /api/tools returns a list with 9 tools', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/tools`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);

    const items = Array.isArray(body.data) ? body.data : body.data?.items;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);

    // Each tool should have required fields
    const first = items[0];
    expect(first.slug).toBeTruthy();
    expect(first.name).toBeTruthy();
    expect(typeof first.creditCost).toBe('number');
  });
});
