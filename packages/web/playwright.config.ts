import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Sotally end-to-end tests.
 * Tests run against the live site at https://sotally.com.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run (60s for live site) */
  timeout: 60_000,
  /* Maximum time for the entire test run (15 min for serial + retries) */
  globalTimeout: 900_000,
  /* Run tests serially to avoid rate limit issues against live site */
  fullyParallel: false,
  workers: 1,
  /* Fail the build on CI if you accidentally left test.only in the source */
  forbidOnly: !!process.env.CI,
  /* Retry failed tests once (helps with flaky network on live site) */
  retries: process.env.CI ? 2 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions such as `await page.goto('/')`. */
    baseURL: 'https://sotally.com',
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',
    /* Set a consistent viewport */
    viewport: { width: 1280, height: 720 },
    /* Ignore HTTPS errors for any cert issues */
    ignoreHTTPSErrors: false,
    /* No extra HTTP headers -- the Accept: application/json header was
       causing page navigation requests to get JSON instead of HTML. */
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    /* Mobile viewport smoke tests */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/landing.spec.ts', '**/marketplace.spec.ts'],
    },
  ],

  /* Output folder for test artifacts */
  outputDir: 'test-results',
});
