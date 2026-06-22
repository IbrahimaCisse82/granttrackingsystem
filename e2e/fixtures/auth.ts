import { test as base, expect, type Page } from '@playwright/test';

/**
 * Fixture qui fournit une page connectée.
 * Skippe les specs si E2E_USER_EMAIL / E2E_USER_PASSWORD ne sont pas définis.
 */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, 'E2E_USER_EMAIL / E2E_USER_PASSWORD requis');

    await page.goto('/auth');
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/mot de passe/i).first().fill(password!);
    await page.getByRole('button', { name: /se connecter|connexion/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|portfolio|$)/, { timeout: 15_000 });
    await use(page);
  },
});

export { expect };
