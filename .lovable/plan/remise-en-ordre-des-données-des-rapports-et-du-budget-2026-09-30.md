# Remise en ordre des données des rapports et du budget

## Objectif
Aujourd'hui, les rapports financiers existent à deux endroits : dans la fiche projet et dans le module d'approbation. Ils peuvent donc se contredire. Le budget et les dépenses sont aussi rangés dans la fiche projet, ce qui ralentit les calculs et complique le contrôle des accès.

L'objectif est d'avoir une seule source fiable pour chaque type de donnée, sans perte de données et sans coupure.

## Étapes (sans interruption de service)
1. **Rapports** : la version du module d'approbation devient la seule référence. Les rapports existants de chaque projet y sont recopiés (un rapport par période). Les écrans Rapport, Fiche et Dashboard lisent cette version. L'ancienne copie dans la fiche projet reste en lecture seule, puis est marquée comme retirée.
2. **Lignes budgétaires** : elles passent dans leur propre table (code, section, description, unité, quantité, montant, allocation), liée au projet et à l'organisation, avec la même isolation par organisation et les mêmes droits par rôle. Les avenants modifient ces lignes.
3. **Transactions** : même traitement (date, pièce, bénéficiaire, montants, taux, pièces jointes), toujours sans suppression possible (contre-passe uniquement).
4. **Journal d'audit** : il couvre automatiquement les nouvelles tables.
5. **Vérification** : totaux budget/dépenses identiques avant et après, pour chaque projet ; typecheck, tests, et parcours réel dans l'aperçu.

## Détails techniques
- Nouvelles tables `budget_lines` et `transactions` (organization_id, project_id, GRANT + RLS via `is_org_member` / `is_org_manager_or_admin`, index sur project_id).
- Recopie par migration additive (INSERT ... SELECT depuis les colonnes jsonb `projects.budget_lines` et `projects.reports`), `periodic_reports` alimentée de la même façon.
- Hooks dédiés (`useBudgetLines`, `useTransactions`), `useProjects` arrête d'écrire ces champs ; `get_dashboard_metrics` et `get_burn_rate_analysis` mis à jour.
- Anciennes colonnes jsonb conservées, commentées `DEPRECATED`, jamais supprimées.

## Risque
Changement profond : je procède table par table et je compare les totaux à chaque étape avant de basculer l'écran suivant.
