import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  // Every test is independent, so tests inside a file also run concurrently.
  fullyParallel: true,
  workers: process.env.CI ? 2 : env.workers,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],
  use: {
    baseURL: env.baseURL,
    testIdAttribute: 'data-testid',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    actionTimeout: 10_000,
  },
  projects: [
    { name: 'api', testDir: './tests/api' },
    {
      name: 'ui',
      testDir: './tests/ui',
      // BROWSER_CHANNEL=msedge|chrome runs on an installed browser instead of Playwright's Chromium.
      use: { ...devices['Desktop Chrome'], channel: env.browserChannel },
    },
  ],
  // Starts the application under test automatically (or reuses one already running).
  webServer: {
    command: 'node app/server.js',
    url: `${env.baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'ignore',
  },
});
