# Architecture rules

- Budget lines, transactions and periodic reports are mirrored from `projects` jsonb into `budget_lines`, `project_transactions`, `periodic_reports` by the `sync_project_normalized` trigger — normalized tables are the read/reporting source; approved reports are never overwritten.
- `project_transactions` is append-only (no client write grants) — corrections go through reversal entries.
