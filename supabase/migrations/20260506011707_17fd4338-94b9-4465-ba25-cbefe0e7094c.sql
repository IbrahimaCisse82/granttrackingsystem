CREATE TABLE public.donor_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name VARCHAR(120) NOT NULL,
  donor_name VARCHAR(120) NOT NULL,
  periodicity VARCHAR(20) NOT NULL DEFAULT 'quarterly',
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donor_report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view templates" ON public.donor_report_templates
FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Managers insert templates" ON public.donor_report_templates
FOR INSERT TO authenticated WITH CHECK (public.is_org_manager_or_admin(auth.uid(), organization_id) AND auth.uid() = created_by);
CREATE POLICY "Managers update templates" ON public.donor_report_templates
FOR UPDATE TO authenticated USING (public.is_org_manager_or_admin(auth.uid(), organization_id));
CREATE POLICY "Org admins delete templates" ON public.donor_report_templates
FOR DELETE TO authenticated USING (public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER donor_report_templates_updated
BEFORE UPDATE ON public.donor_report_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.donor_report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.donor_report_templates(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  generated_by UUID,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donor_report_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view runs" ON public.donor_report_runs
FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Managers create runs" ON public.donor_report_runs
FOR INSERT TO authenticated WITH CHECK (public.is_org_manager_or_admin(auth.uid(), organization_id) AND auth.uid() = generated_by);
CREATE POLICY "Managers update runs" ON public.donor_report_runs
FOR UPDATE TO authenticated USING (public.is_org_manager_or_admin(auth.uid(), organization_id));
CREATE POLICY "Org admins delete runs" ON public.donor_report_runs
FOR DELETE TO authenticated USING (public.is_org_admin(auth.uid(), organization_id));

CREATE INDEX idx_donor_runs_project ON public.donor_report_runs(project_id);
CREATE INDEX idx_donor_runs_template ON public.donor_report_runs(template_id);