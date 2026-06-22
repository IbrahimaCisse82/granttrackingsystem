import { test, expect } from '@playwright/test';

test.describe('Smoke — routes publiques', () => {
  test('la page de connexion se charge', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('une route inconnue affiche le 404', async ({ page }) => {
    const res = await page.goto('/cette-route-nexiste-pas');
    // Le router renvoie 200 + composant NotFound
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByText(/404|introuvable|not found/i)).toBeVisible();
  });

  test('les en-têtes de sécurité sont présents', async ({ page }) => {
    const res = await page.goto('/auth');
    const html = await res!.text();
    expect(html).toContain('Content-Security-Policy');
    expect(html).toContain('Referrer-Policy');
    expect(html).toContain('X-Content-Type-Options');
  });
});
