
CREATE INDEX IF NOT EXISTS idx_projects_org_archived_created ON public.projects(organization_id, archived, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_org_pays ON public.projects(organization_id, pays);
CREATE INDEX IF NOT EXISTS idx_projects_org_risque ON public.projects(organization_id, risque);
CREATE INDEX IF NOT EXISTS idx_projects_org_fin ON public.projects(organization_id, fin);
CREATE INDEX IF NOT EXISTS idx_projects_org_debut ON public.projects(organization_id, debut);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_projects_org_trgm ON public.projects USING gin (org gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_title_trgm ON public.projects USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_convention_trgm ON public.projects USING gin (convention gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_periodic_reports_project ON public.periodic_reports(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_org_status ON public.periodic_reports(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_deadline ON public.periodic_reports(deadline_approval) WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS idx_approval_workflows_entity ON public.approval_workflows(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_org ON public.approval_workflows(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON public.notifications(project_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_project_created ON public.audit_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_comments_project_created ON public.comments(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_vouchers_project ON public.payment_vouchers(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_vouchers_org ON public.payment_vouchers(organization_id);

CREATE INDEX IF NOT EXISTS idx_field_reports_project ON public.field_reports(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_reports_org ON public.field_reports(organization_id);

CREATE INDEX IF NOT EXISTS idx_donor_report_runs_template ON public.donor_report_runs(template_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_donor_report_runs_org ON public.donor_report_runs(organization_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_donor_report_templates_org ON public.donor_report_templates(organization_id);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_org_date ON public.exchange_rates(organization_id, rate_date DESC);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_project_beneficiaries_user ON public.project_beneficiaries(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_project_beneficiaries_project ON public.project_beneficiaries(project_id);

ANALYZE public.projects;
ANALYZE public.periodic_reports;
ANALYZE public.notifications;
ANALYZE public.audit_logs;
