import type { PlaywrightTestConfig, ReporterDescription, } from '@playwright/test';
import { devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';

// Get variables from app's server
dotenv.config({path: `../code/server/.env`});

const reporters:ReporterDescription[] = [
  ['list'],
  ['json', {  outputFile: 'results/test-results.json' }] 
];

if (process.env.CI) {
  reporters.unshift(['github'])
}

type LocationData = {
  locale: string,
  geolocation: { latitude: number, longitude: number },
  timezoneId: string,
}

const locations:Record<string, LocationData> = {
  Berlin: {
    locale: 'de-DE',
    geolocation: { latitude: 52.5245, longitude: 13.4100 },
    timezoneId: 'Europe/Berlin',
  },
  NewYork : {
    locale: 'en-US',
    geolocation: { latitude: 40.7128, longitude: -74.0060 },
    timezoneId: 'America/New_York'
  },
  Tokyo: {
    locale: 'ja',
    geolocation: { latitude: 35.6895, longitude: 139.6923 },
    timezoneId: 'Asia/Tokyo',
  },
}


/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './specs',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 7.5 * 1000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* No retries even on CI, failures delay feedback for too long */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: reporters,
  globalSetup: './setup.ts',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: `http://localhost:${process.env.PORT}`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Simulate tests running in NYC for consistency */
    permissions: ['geolocation'],
    ...locations.NewYork,

    /* CSP isn't within this assessment's scope */
    bypassCSP: true
  },

  /* Only testing against Chromium */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'results/artifacts/',

  /* Run your local dev server before starting the tests */
  webServer: {
    port: 4242,
    reuseExistingServer: !process.env.CI,
    timeout: 5 * 1000,
    command: 'cd ../code/server; sh start.sh'
  },
};

export default config;