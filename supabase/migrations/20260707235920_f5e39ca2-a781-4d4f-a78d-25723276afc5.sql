
DO $$ BEGIN
  CREATE TYPE public.risk_category AS ENUM ('operational','financial','security','reputation','compliance','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.risk_status AS ENUM ('open','mitigated','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.project_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category public.risk_category NOT NULL DEFAULT 'operational',
  description text NOT NULL,
  likelihood int NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  impact int NOT NULL CHECK (impact BETWEEN 1 AND 5),
  score int GENERATED ALWAYS AS (likelihood * impact) STORED,
  mitigation text DEFAULT '',
  owner text DEFAULT '',
  status public.risk_status NOT NULL DEFAULT 'open',
  review_date date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_risks TO authenticated;
GRANT ALL ON public.project_risks TO service_role;

ALTER TABLE public.project_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can view risks"
  ON public.project_risks FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org members can insert risks"
  ON public.project_risks FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org members can update risks"
  ON public.project_risks FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org managers can delete risks"
  ON public.project_risks FOR DELETE TO authenticated
  USING (public.is_org_manager_or_admin(auth.uid(), organization_id));

CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON public.project_risks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_risks_changes AFTER INSERT OR UPDATE OR DELETE ON public.project_risks
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE INDEX idx_project_risks_project ON public.project_risks(project_id);
