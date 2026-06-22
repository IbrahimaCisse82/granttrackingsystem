import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test('redirige les routes protégées vers /auth', async ({ page }) => {
    await page.goto('/portfolio');
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });

  test('rejette des identifiants invalides', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/email/i).fill('inconnu@example.com');
    await page.getByLabel(/mot de passe/i).first().fill('mauvaisMotDePasse!');
    await page.getByRole('button', { name: /se connecter|connexion/i }).click();

    // Un toast d'erreur (sonner) ou un message inline doit apparaître
    await expect(
      page.getByText(/invalid|incorrect|invalides|erreur/i).first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth/);
  });
});
