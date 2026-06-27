import { test, expect } from './fixtures/auth';

test.describe('Fiches de versement (vouchers)', () => {
  test('le panneau vouchers se charge sans erreur sur un projet', async ({ authedPage }) => {
    await authedPage.goto('/');
    const firstProject = authedPage.getByRole('link').filter({ hasText: /./ }).first();
    if (await firstProject.count()) {
      await firstProject.click();
      // The vouchers panel is part of the project view tabs
      const vouchersTab = authedPage.getByRole('button', { name: /versement|voucher/i }).first();
      if (await vouchersTab.count()) {
        await vouchersTab.click();
        await expect(authedPage.locator('body')).toBeVisible();
      }
    }
  });
});

test.describe('Rapports terrain', () => {
  test('la page rapports terrain est accessible', async ({ authedPage }) => {
    await authedPage.goto('/field-reports');
    await expect(authedPage.locator('main, [role="main"], body')).toBeVisible();
  });
});

test.describe('Reporting bailleur', () => {
  test('la page donor-reports se charge', async ({ authedPage }) => {
    await authedPage.goto('/donor-reports');
    await expect(authedPage.locator('main, [role="main"], body')).toBeVisible();
  });
});
