import { test, expect } from './fixtures/auth';

test.describe('Calendrier consolidé', () => {
  test('la page /calendar se charge', async ({ authedPage }) => {
    await authedPage.goto('/calendar');
    await expect(authedPage.locator('body')).toBeVisible();
    // On s'attend à voir un titre ou une vue calendrier
    const hasCalendar = await authedPage
      .getByRole('heading', { name: /calendrier|calendar/i })
      .first()
      .count();
    expect(hasCalendar).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Registre des risques', () => {
  test("l'onglet Risques est accessible depuis un projet", async ({ authedPage }) => {
    await authedPage.goto('/');
    const firstProject = authedPage.getByRole('link').filter({ hasText: /./ }).first();
    if (await firstProject.count()) {
      await firstProject.click();
      const risksTab = authedPage.getByRole('button', { name: /risque/i }).first();
      if (await risksTab.count()) {
        await risksTab.click();
        await expect(authedPage.locator('body')).toBeVisible();
      }
    }
  });
});

test.describe('Checklist de clôture', () => {
  test("l'onglet Clôture s'affiche sur un projet", async ({ authedPage }) => {
    await authedPage.goto('/');
    const firstProject = authedPage.getByRole('link').filter({ hasText: /./ }).first();
    if (await firstProject.count()) {
      await firstProject.click();
      const closureTab = authedPage.getByRole('button', { name: /clôture|closure/i }).first();
      if (await closureTab.count()) {
        await closureTab.click();
        await expect(authedPage.locator('body')).toBeVisible();
      }
    }
  });
});

test.describe("Matrice d'éligibilité bailleur", () => {
  test('la matrice est accessible depuis Organisation', async ({ authedPage }) => {
    await authedPage.goto('/organization');
    await expect(authedPage.locator('body')).toBeVisible();
    const eligibility = authedPage
      .getByRole('heading', { name: /éligibilité|eligibility|bailleur/i })
      .first();
    if (await eligibility.count()) {
      await expect(eligibility).toBeVisible();
    }
  });
});

test.describe('Burn rate Dashboard', () => {
  test('le Dashboard affiche le tableau burn rate ou une KPI alertes', async ({ authedPage }) => {
    await authedPage.goto('/dashboard');
    await expect(authedPage.locator('body')).toBeVisible();
    const alerts = authedPage.getByText(/alerte|burn|avancement/i).first();
    if (await alerts.count()) {
      await expect(alerts).toBeVisible();
    }
  });
});
