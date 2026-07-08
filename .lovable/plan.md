
# Plan — 5 priorités Grant Manager

Livraison itérative en 5 lots indépendants, chacun testable seul. Chaque lot = 1 migration + composants UI + intégration Portfolio/Dashboard/ProjectView.

## Lot 1 — Burn rate & forecast portefeuille (M)

**Objectif** : visualiser rythme de consommation vs temps écoulé, projeter fin de projet, alerter sur sur/sous-consommation.

- Étendre `get_dashboard_metrics` (RPC) pour renvoyer par projet : `elapsed_pct`, `burn_pct`, `variance` (burn - elapsed), `forecast_end_date`, `status` (on-track / under / over).
- Nouveau composant `BurnRateTable` sur `Dashboard` : liste des projets avec barre de progression double (temps vs budget) + badge d'alerte (>15% écart).
- Nouvelle carte KPI **"Projets en alerte"** dans la grille Dashboard.
- Notification auto (via trigger existant `notifications`) si `abs(variance) > 20%` au moment d'un rapport soumis.

## Lot 2 — Checklist de clôture projet (S)

**Objectif** : sécuriser l'archivage (audit externe, bailleurs UE/AFD).

- Nouvelle table `project_closure_checklists` (project_id, item_key, checked, checked_by, checked_at, notes).
- Items standard seedés : rapport final soumis, dépenses réconciliées, fiches versement rapprochées, inventaire actifs, rapport audit, leçons apprises, lettre clôture bailleur, transfert bénéficiaires.
- Nouveau panneau `ProjectClosurePanel` visible dans `ProjectView` (onglet "Clôture") — activation quand `fin < now() + 60d` ou projet marqué "en clôture".
- Blocage de l'archivage tant que checklist < 100% (dialog de confirmation).

## Lot 3 — Registre de risques structuré (M)

**Objectif** : conformité UE/AFD, remplacer le champ `risque` déclaratif.

- Nouvelle table `project_risks` : project_id, category (opérationnel/financier/sécurité/réputation/conformité), description, likelihood (1-5), impact (1-5), score (calculé), mitigation, owner, status (open/mitigated/closed), review_date.
- Composant `ProjectRiskRegister` (onglet "Risques" dans ProjectView) : matrice 5×5 avec heatmap, tableau CRUD, filtre par catégorie.
- Score global projet = moyenne des scores ouverts, alimente la carte "Distribution des risques" du Dashboard (remplace le champ statique).

## Lot 4 — Calendrier consolidé (S)

**Objectif** : premier outil quotidien du Grant Manager.

- Nouvelle page `/calendar` (route + entrée sidebar) affichant :
  - Deadlines rapports périodiques (source: `periodic_reports.deadline_approval`)
  - Dates de versement prévues (source: `payment_vouchers.payment_date`)
  - Fins de projet à J-60 (source: `projects.fin`)
  - Revues de risques (source: `project_risks.review_date`, lot 3)
- Vue mensuelle (react-day-picker déjà présent) + liste "30 prochains jours".
- Filtre par projet et type d'événement.

## Lot 5 — Matrice d'éligibilité par bailleur (M)

**Objectif** : réduire les dépenses inéligibles rejetées.

- Nouvelle table `donor_eligibility_rules` : donor_name, category (ex "Personnel", "Équipement"), rule_type (allowed/forbidden/capped), cap_pct, cap_amount, notes.
- Nouvelle table `donor_document_checklist` : donor_name, doc_key, mandatory, phase (contract/reporting/closure).
- Composant `DonorEligibilityMatrix` accessible depuis `OrganizationSettings` — CRUD par bailleur, import/export CSV.
- Dans `ProjectTransactions`, badge d'alerte quand catégorie de dépense marquée `forbidden` ou dépasse `cap` du bailleur principal du projet.

## Détails techniques

- Toutes tables `public.*` → GRANT authenticated + service_role + RLS scopée organization_id via `is_org_member`.
- Triggers `update_updated_at_column` + `log_audit_change` sur toutes nouvelles tables.
- Séquence de migrations : 1 migration par lot (5 au total, séquentielles pour éviter les conflits d'approbation).
- Frontend : hooks TanStack Query (`useBurnRate`, `useClosureChecklist`, `useProjectRisks`, `useCalendarEvents`, `useDonorEligibility`).
- i18n : nouvelles clés FR + EN pour chaque lot.

## Séquence d'exécution

Je livre Lot 1 en premier (migration → hooks → UI Dashboard), puis j'attends votre validation avant d'enchaîner Lot 2, etc. À chaque lot : build vérifié, changement visible dans la preview.

Confirmez pour démarrer le Lot 1.
