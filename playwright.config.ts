import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

// Charge les identifiants E2E depuis .env.e2e (prioritaire) puis .env,
// afin que E2E_USER_EMAIL / E2E_USER_PASSWORD n'aient pas à être exportés à la main.
loadEnv({ path: '.env.e2e' });
loadEnv();

/**
 * Configuration Playwright pour les tests E2E.
 * Lance le dev server Vite automatiquement.
 *
 * Usage local :
 *   npx playwright install chromium    # une seule fois
 *   bun run e2e
 *   bun run e2e:ui                     # mode interactif
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'bun run dev',
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
