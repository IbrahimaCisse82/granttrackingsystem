# Ledger isolation test (ledger-rls.sql)

Checks that `project_transactions` and `budget_lines` are only readable by members of the owning
organization, invisible to outsiders, and not writable by clients.
Run with a privileged database role (one allowed to `SET ROLE authenticated`).
The block always ends with an exception, so everything rolls back:
`LEDGER_RLS_PASS` = success, `LEDGER_RLS_FAIL` = a rule is broken.
Last run 2026-10-04: PASS (A: own 1 / other 0, B: own 1 / other 0, outsider 0, client writes refused).
