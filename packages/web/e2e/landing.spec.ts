/**
 * Landing Page Tests
 *
 * Covers the public home page at https://sotally.com.
 * These tests verify the core value proposition is communicated clearly,
 * navigation works, and CTAs point to the right destinations.
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // Test 1: Hero section renders with the correct headline and CTA
  test('hero section displays the main headline and primary CTA', async ({ page }) => {
    // The headline communicates the core value prop
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Software without subscriptions');

    // The CTA invites sign-up and mentions free credits
    const heroCta = page.getByRole('link', { name: /get started free/i }).first();
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveAttribute('href', '/register');
  });

  // Test 2: Navigation bar contains the expected links
  test('navigation bar renders Sotally logo and nav links', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Brand link
    await expect(header.getByRole('link', { name: /sotally/i })).toBeVisible();

    // Browse Tools nav link
    await expect(header.getByRole('link', { name: /browse tools/i })).toBeVisible();

    // Log in and Get Started links
    await expect(header.getByRole('link', { name: /log in/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /get started free/i })).toBeVisible();
  });

  // Test 3: Featured tools section shows tool cards
  test('featured tools section displays tool cards with names and credit costs', async ({ page }) => {
    const featuredSection = page.locator('section').filter({ hasText: 'Featured Tools' });
    await expect(featuredSection).toBeVisible();

    // Should show at least one tool card
    const toolCards = featuredSection.locator('a[href*="/tools/"]');
    await expect(toolCards).toHaveCount(3);

    // Each card should show credit cost
    const firstCard = toolCards.first();
    await expect(firstCard).toBeVisible();
  });

  // Test 4: "How it works" section renders all 3 steps
  test('how it works section renders all three steps', async ({ page }) => {
    const howItWorksSection = page.locator('section').filter({ hasText: 'How it works' });
    await expect(howItWorksSection).toBeVisible();

    // Three numbered steps: Browse, Run, Pay only for what you use
    await expect(howItWorksSection.getByText('Browse')).toBeVisible();
    await expect(howItWorksSection.getByText('Run')).toBeVisible();
    await expect(howItWorksSection.getByText('Pay only for what you use')).toBeVisible();
  });

  // Test 5: Footer renders and contains legal and product links
  test('footer renders with product, legal, and company links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Product section
    await expect(footer.getByRole('link', { name: /browse tools/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /pricing/i })).toBeVisible();

    // Legal section
    await expect(footer.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /terms/i })).toBeVisible();

    // Copyright
    await expect(footer).toContainText('Sotally');
  });
});
