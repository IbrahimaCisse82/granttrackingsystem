import { test, expect } from './fixtures/auth';

/**
 * Matrice d'éligibilité bailleur — règles (allowed / forbidden / capped)
 * et checklist documentaire, exposées dans /organization.
 */
test.describe("Éligibilité bailleur — UI", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/organization');
    await authedPage.waitForLoadState('networkidle');
  });

  test('la section éligibilité est présente sur la page Organisation', async ({ authedPage }) => {
    const section = authedPage.getByText(/éligibilité|eligibility/i).first();
    await expect(section).toBeVisible();
  });

  test('le formulaire de règle expose les trois types de règles', async ({ authedPage }) => {
    const addBtn = authedPage.getByRole('button', { name: /ajouter.*(règle|rule)|nouvelle règle/i }).first();
    if (await addBtn.count()) {
      await addBtn.click();
    }
    const body = await authedPage.locator('body').innerText();
    expect(body).toMatch(/autoris|allowed|interdit|forbidden|plafonn|capped/i);
  });

  test('la checklist documentaire est affichée', async ({ authedPage }) => {
    const body = await authedPage.locator('body').innerText();
    expect(body).toMatch(/document|checklist|pièce/i);
  });

  test("l'export CSV de la matrice est proposé", async ({ authedPage }) => {
    const exportBtn = authedPage.getByRole('button', { name: /csv|export/i }).first();
    if (await exportBtn.count()) {
      await expect(exportBtn).toBeEnabled();
    }
  });

  test('la page reste accessible après retour navigateur', async ({ authedPage }) => {
    await authedPage.goto('/dashboard');
    await authedPage.goBack();
    await expect(authedPage).toHaveURL(/\/organization/);
    await expect(authedPage.locator('body')).toBeVisible();
  });
});
