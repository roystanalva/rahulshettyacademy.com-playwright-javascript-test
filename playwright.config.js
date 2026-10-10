const { defineConfig, devices } = require('@playwright/test');
const env = require('./config/env');

const allBrowsers = process.env.ALL_BROWSERS === 'true';

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'results/results.json' }],
    ['junit', { outputFile: 'results/junit.xml' }],
  ],
  use: {
    baseURL: env.baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: false,
  },
  projects: [
    // Offline tests: no browser, no network
    { name: 'unit', testMatch: /tests\/unit\/.*\.spec\.js/ },
    {
      name: 'chromium',
      testIgnore: /tests\/unit\/.*/,
      use: { ...devices['Desktop Chrome'] },
    },
    ...(allBrowsers
      ? [
          { name: 'firefox', testIgnore: /tests\/unit\/.*/, use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', testIgnore: /tests\/unit\/.*/, use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
});
