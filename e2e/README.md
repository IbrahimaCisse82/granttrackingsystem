# Tests E2E — Playwright

Sécurise les parcours critiques de Grow Hub GTS contre les régressions.

## Prérequis (une seule fois)

```bash
npx playwright install chromium
```

## Lancer les tests

```bash
bun run e2e          # headless
bun run e2e:ui       # mode interactif (recommandé en dev)
bun run e2e:report   # ouvre le dernier rapport HTML
```

Le dev server Vite est démarré automatiquement (`webServer` dans `playwright.config.ts`). Pour cibler un environnement déjà déployé :

```bash
E2E_BASE_URL=https://app.example.com bun run e2e
```

## Authentification

Les specs qui nécessitent une session utilisent `e2e/fixtures/auth.ts`. Renseigne les variables d'environnement avant de lancer :

```bash
export E2E_USER_EMAIL="qa@example.com"
export E2E_USER_PASSWORD="…"
```

Sans ces variables, les specs auth-only sont automatiquement skippées (les smoke tests publics tournent toujours).

## Organisation

```
e2e/
├── fixtures/auth.ts        # fixture session connectée
├── smoke.spec.ts           # routes publiques (auth, 404)
├── auth.spec.ts            # connexion / garde de route
├── portfolio.spec.ts       # navigation et liste projets
└── create-project.spec.ts  # création + validation Zod
```

## Conventions

- Préférer les sélecteurs par rôle (`getByRole`) et label, pas les classes CSS.
- Un `test.describe` par parcours métier.
- Pas de `waitForTimeout` arbitraire — utiliser `expect(...).toBeVisible()` / `toHaveURL()`.
