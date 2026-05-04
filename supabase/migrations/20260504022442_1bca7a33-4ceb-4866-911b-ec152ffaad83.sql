-- Table d'assignation bénéficiaires <-> projets
CREATE TABLE public.project_beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  beneficiary_id UUID NOT NULL,
  assigned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, beneficiary_id)
);

CREATE INDEX idx_project_beneficiaries_user ON public.project_beneficiaries(beneficiary_id);
CREATE INDEX idx_project_beneficiaries_project ON public.project_beneficiaries(project_id);

ALTER TABLE public.project_beneficiaries ENABLE ROW LEVEL SECURITY;

-- Helper: is current user assigned beneficiary on project
CREATE OR REPLACE FUNCTION public.is_project_beneficiary(_user_id uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_beneficiaries
    WHERE project_id = _project_id AND beneficiary_id = _user_id
  )
$$;

CREATE POLICY "Org members view assignments" ON public.project_beneficiaries
  FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR beneficiary_id = auth.uid());

CREATE POLICY "Org admins manage assignments" ON public.project_beneficiaries
  FOR INSERT TO authenticated
  WITH CHECK (is_org_admin(auth.uid(), organization_id) AND auth.uid() = assigned_by);

CREATE POLICY "Org admins delete assignments" ON public.project_beneficiaries
  FOR DELETE TO authenticated
  USING (is_org_admin(auth.uid(), organization_id));

-- Field reports
CREATE TABLE public.field_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  beneficiary_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  narrative TEXT NOT NULL DEFAULT '',
  indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT field_reports_status_chk CHECK (status IN ('draft','submitted','reviewed'))
);

CREATE INDEX idx_field_reports_project ON public.field_reports(project_id);
CREATE INDEX idx_field_reports_beneficiary ON public.field_reports(beneficiary_id);

ALTER TABLE public.field_reports ENABLE ROW LEVEL SECURITY;

-- Beneficiary sees own reports; managers/admins see all org reports
CREATE POLICY "View field reports" ON public.field_reports
  FOR SELECT TO authenticated
  USING (
    beneficiary_id = auth.uid()
    OR is_org_manager_or_admin(auth.uid(), organization_id)
  );

-- Beneficiary can create their own reports on assigned projects
CREATE POLICY "Beneficiary creates own reports" ON public.field_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = beneficiary_id
    AND is_project_beneficiary(auth.uid(), project_id)
  );

-- Beneficiary updates own draft; managers/admins update review fields
CREATE POLICY "Update field reports" ON public.field_reports
  FOR UPDATE TO authenticated
  USING (
    (beneficiary_id = auth.uid() AND status IN ('draft','submitted'))
    OR is_org_manager_or_admin(auth.uid(), organization_id)
  );

CREATE POLICY "Org admins delete field reports" ON public.field_reports
  FOR DELETE TO authenticated
  USING (is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER trg_field_reports_updated
  BEFORE UPDATE ON public.field_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();