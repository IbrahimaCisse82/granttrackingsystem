import { test, expect } from './fixtures/auth';

test.describe('Création de projet — validation Zod', () => {
  test('refuse un formulaire vide et affiche les erreurs', async ({ authedPage }) => {
    await authedPage.goto('/portfolio');
    await authedPage.getByRole('button', { name: /nouveau projet|créer/i }).first().click();

    const dialog = authedPage.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Tente de soumettre sans rien remplir
    await dialog.getByRole('button', { name: /créer|valider|enregistrer/i }).click();

    // Au moins un message d'erreur de validation doit apparaître
    await expect(
      dialog.getByText(/requis|obligatoire|min|invalide/i).first()
    ).toBeVisible({ timeout: 5_000 });

    // Le dialog reste ouvert (création non effectuée)
    await expect(dialog).toBeVisible();
  });
});
