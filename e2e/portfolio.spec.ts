import { test, expect } from './fixtures/auth';

test.describe('Portfolio (authentifié)', () => {
  test('affiche la liste des projets', async ({ authedPage }) => {
    await authedPage.goto('/portfolio');
    await expect(
      authedPage.getByRole('heading', { name: /portfolio|projets/i })
    ).toBeVisible();
  });

  test('le bouton « Nouveau projet » ouvre le dialog', async ({ authedPage }) => {
    await authedPage.goto('/portfolio');
    const btn = authedPage.getByRole('button', { name: /nouveau projet|créer/i }).first();
    await btn.click();
    await expect(authedPage.getByRole('dialog')).toBeVisible();
  });
});
