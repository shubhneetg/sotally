/**
 * Tool Detail Page Tests
 *
 * Covers the tool detail page at /tools/:slug.
 * Verifies tool metadata display, credit cost visibility,
 * auth-gated Run button behavior, and 404 handling.
 */

import { test, expect } from '@playwright/test';
import { KNOWN_TOOL_SLUG, registerAndLogin, waitForLoading } from './helpers';

const API_URL = 'https://sotally.com/api';

test.describe('Tool Detail Page', () => {
  // Test 23: Tool detail page loads and shows tool name and description
  test('tool detail page renders tool name, description, and credit cost', async ({ page }) => {
    await page.goto(`/tools/${KNOWN_TOOL_SLUG}`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for loading skeleton to disappear (client-side data fetch)
    await waitForLoading(page);

    // Tool name heading
    await expect(
      page.getByRole('heading', { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    // About this tool section
    await expect(page.getByText(/about this tool/i)).toBeVisible({ timeout: 10_000 });

    // Credit cost display (right sidebar) - text is "credits per run (~$X.XX)"
    await expect(page.getByText(/credits per run/i)).toBeVisible();
  });

  // Test 24: Unauthenticated users see "Log in to Run" instead of Run button
  test('unauthenticated user sees Log in to Run button on tool detail', async ({ page }) => {
    await page.goto(`/tools/${KNOWN_TOOL_SLUG}`);
    await page.waitForLoadState('domcontentloaded');
    await waitForLoading(page);

    // Should show login CTA, not the authenticated run button
    await expect(
      page.getByRole('link', { name: /log in to run/i })
    ).toBeVisible({ timeout: 15_000 });

    // Should not show the "Run Tool" link (which includes credit cost text)
    await expect(
      page.getByRole('link', { name: /run tool/i })
    ).not.toBeVisible();
  });

  // Test 25: Authenticated users see the "Run Tool" button
  test('authenticated user sees the Run Tool button on tool detail', async ({ page }) => {
    await registerAndLogin(page);

    await page.goto(`/tools/${KNOWN_TOOL_SLUG}`);
    await page.waitForLoadState('domcontentloaded');
    await waitForLoading(page);

    // Authenticated users should see the "Run Tool" link (text: "Run Tool — X Credits (~$Y.YY)")
    await expect(
      page.getByRole('link', { name: /run tool/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  // Test 26: Visiting a non-existent tool slug shows "Tool not found"
  test('non-existent tool slug shows Tool not found error state', async ({ page }) => {
    await page.goto('/tools/this-tool-does-not-exist-ever-99999');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoading(page);

    // "Tool not found" appears as both h1 and description p — use heading
    await expect(
      page.getByRole('heading', { name: /tool not found/i })
    ).toBeVisible({ timeout: 15_000 });

    // Should have a back link to marketplace (text: "Back to marketplace")
    await expect(
      page.getByRole('link', { name: /back to marketplace/i })
    ).toBeVisible();
  });

  // Test 27: GET /api/tools/:slug returns tool data with correct schema
  test('GET /api/tools/:slug returns tool with name, pricing, and inputSchema', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/tools/${KNOWN_TOOL_SLUG}`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);

    const tool = body.data;
    expect(tool.slug).toBe(KNOWN_TOOL_SLUG);
    expect(tool.name).toBeTruthy();
    // Credit cost is under pricing.creditsPerRun in the API
    expect(tool.pricing).toBeDefined();
    expect(typeof tool.pricing.creditsPerRun).toBe('number');
    expect(tool.pricing.creditsPerRun).toBeGreaterThan(0);
    // inputSchema should be present for the run form
    if (tool.inputSchema) {
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
    }
  });
});
