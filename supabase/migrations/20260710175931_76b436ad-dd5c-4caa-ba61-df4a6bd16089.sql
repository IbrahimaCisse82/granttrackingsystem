
-- Enum for rule types
DO $$ BEGIN
  CREATE TYPE public.donor_rule_type AS ENUM ('allowed', 'forbidden', 'capped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.donor_doc_phase AS ENUM ('contract', 'reporting', 'closure');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Eligibility rules
CREATE TABLE IF NOT EXISTS public.donor_eligibility_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  donor_name text NOT NULL,
  category text NOT NULL,
  rule_type public.donor_rule_type NOT NULL DEFAULT 'allowed',
  cap_pct numeric,
  cap_amount numeric,
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.donor_eligibility_rules TO authenticated;
GRANT ALL ON public.donor_eligibility_rules TO service_role;

ALTER TABLE public.donor_eligibility_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read eligibility rules"
  ON public.donor_eligibility_rules FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins write eligibility rules"
  ON public.donor_eligibility_rules FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE INDEX donor_eligibility_rules_org_idx ON public.donor_eligibility_rules(organization_id, donor_name);

CREATE TRIGGER trg_donor_eligibility_rules_updated
  BEFORE UPDATE ON public.donor_eligibility_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_donor_eligibility_rules_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.donor_eligibility_rules
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- Document checklist
CREATE TABLE IF NOT EXISTS public.donor_document_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  donor_name text NOT NULL,
  doc_key text NOT NULL,
  doc_label text NOT NULL,
  mandatory boolean NOT NULL DEFAULT true,
  phase public.donor_doc_phase NOT NULL DEFAULT 'reporting',
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, donor_name, doc_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.donor_document_checklist TO authenticated;
GRANT ALL ON public.donor_document_checklist TO service_role;

ALTER TABLE public.donor_document_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read doc checklist"
  ON public.donor_document_checklist FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins write doc checklist"
  ON public.donor_document_checklist FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE INDEX donor_document_checklist_org_idx ON public.donor_document_checklist(organization_id, donor_name);

CREATE TRIGGER trg_donor_document_checklist_updated
  BEFORE UPDATE ON public.donor_document_checklist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_donor_document_checklist_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.donor_document_checklist
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();
