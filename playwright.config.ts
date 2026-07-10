import { defineConfig } from '@playwright/test';
import { config } from './src/config/config';

/**
 * Playwright configuration for API-only testing.
 * No browsers, no UI — pure HTTP request validation.
 *
 * Reads values directly from the centralized config layer in src/config/config.ts.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({

  /* ──────────────────────────────────────────────
   * Test Discovery
   * ────────────────────────────────────────────── */

  /** Root directory where Playwright scans for test files. */
  testDir: './tests',

  /* ──────────────────────────────────────────────
   * Execution
   * ────────────────────────────────────────────── */

  /** Run all tests in all files in parallel. */
  fullyParallel: true,

  /** Fail the entire run if test.only is left in the codebase (only in CI). */
  forbidOnly: config.test.isCi,

  /** Retry failed tests to handle transient network/server errors. */
  retries: config.test.retries,

  /** Number of parallel worker processes. */
  workers: config.test.workers,

  /** Maximum time (ms) a single test can run before timing out. */
  timeout: config.api.timeout,

  /* ──────────────────────────────────────────────
   * Reporting
   * ────────────────────────────────────────────── */

  /** Standard enterprise reports. HTML reports save into reports/html. */
  reporter: [
    ['list'],
    ['html', { outputFolder: './reports/html', open: 'never' }],
  ],

  /* ──────────────────────────────────────────────
   * Shared Request Configuration
   * ────────────────────────────────────────────── */

  use: {
    /** Base URL prepended to all relative request paths. */
    baseURL: config.api.baseUrl,

    /** Default headers attached to every outgoing HTTP request. */
    extraHTTPHeaders: {
      ...config.api.headers,
    },
  },

  /* ──────────────────────────────────────────────
   * Projects
   * ────────────────────────────────────────────── */

  /** Single project for API testing — no browser matrix needed. */
  projects: [
    {
      name: 'api',
    },
  ],
});
