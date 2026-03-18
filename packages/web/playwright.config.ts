import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const HOME = process.env.HOME || '/home/jarvis';
const localLibs = [
  path.join(HOME, 'local-libs/usr/lib/x86_64-linux-gnu'),
  path.join(HOME, 'local-libs/lib/x86_64-linux-gnu'),
].join(':');

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  globalTimeout: 900_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
          env: {
            ...process.env,
            LD_LIBRARY_PATH: localLibs + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : ''),
            FONTCONFIG_PATH: path.join(HOME, '.config/fontconfig'),
            FONTCONFIG_FILE: path.join(HOME, '.config/fontconfig/fonts.conf'),
          },
        },
      },
    },
  ],
  outputDir: 'test-results',
});
