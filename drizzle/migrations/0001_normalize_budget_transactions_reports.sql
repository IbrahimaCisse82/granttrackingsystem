CREATE TABLE public.budget_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id),
  position integer NOT NULL DEFAULT 0,
  code text NOT NULL,
  section text NOT NULL DEFAULT 'A',
  description text NOT NULL DEFAULT '',
  unite text NOT NULL DEFAULT '',
  qty numeric NOT NULL DEFAULT 0,
  montant numeric NOT NULL DEFAULT 0,
  allocation numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, code)
);
GRANT SELECT ON public.budget_lines TO authenticated;
GRANT ALL ON public.budget_lines TO service_role;
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members view budget lines" ON public.budget_lines FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) OR public.is_project_beneficiary(auth.uid(), project_id));
CREATE INDEX idx_budget_lines_project ON public.budget_lines(project_id);
CREATE INDEX idx_budget_lines_org ON public.budget_lines(organization_id);

CREATE TABLE public.project_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id),
  report_index integer NOT NULL,
  external_id text NOT NULL,
  code text NOT NULL DEFAULT '',
  tx_date text,
  voucher text,
  beneficiaire text,
  montant_devise numeric NOT NULL DEFAULT 0,
  taux_change numeric NOT NULL DEFAULT 0,
  montant_eur numeric NOT NULL DEFAULT 0,
  description text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, report_index, external_id)
);
GRANT SELECT ON public.project_transactions TO authenticated;
GRANT ALL ON public.project_transactions TO service_role;
ALTER TABLE public.project_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members view transactions" ON public.project_transactions FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) OR public.is_project_beneficiary(auth.uid(), project_id));
CREATE INDEX idx_project_tx_project ON public.project_transactions(project_id, report_index);
CREATE INDEX idx_project_tx_org ON public.project_transactions(organization_id);

CREATE TRIGGER audit_budget_lines AFTER INSERT OR DELETE OR UPDATE ON public.budget_lines
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();
CREATE TRIGGER audit_project_transactions AFTER INSERT OR DELETE OR UPDATE ON public.project_transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();
CREATE TRIGGER trg_budget_lines_updated BEFORE UPDATE ON public.budget_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_project_tx_updated BEFORE UPDATE ON public.project_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_project_normalized(_project_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.projects%ROWTYPE;
BEGIN
  SELECT * INTO p FROM public.projects WHERE id = _project_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Budget lines: mirror exactly
  DELETE FROM public.budget_lines b WHERE b.project_id = p.id
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(p.budget_lines,'[]'::jsonb)) e WHERE e->>'code' = b.code);
  INSERT INTO public.budget_lines (project_id, organization_id, position, code, section, description, unite, qty, montant, allocation)
  SELECT p.id, p.organization_id, (e.ord - 1)::int, e.v->>'code', COALESCE(e.v->>'section','A'), COALESCE(e.v->>'desc',''),
         COALESCE(e.v->>'unite',''), COALESCE(NULLIF(e.v->>'qty','')::numeric,0), COALESCE(NULLIF(e.v->>'montant','')::numeric,0),
         COALESCE(NULLIF(e.v->>'allocation','')::numeric,0)
  FROM jsonb_array_elements(COALESCE(p.budget_lines,'[]'::jsonb)) WITH ORDINALITY AS e(v, ord)
  WHERE COALESCE(e.v->>'code','') <> ''
  ON CONFLICT (project_id, code) DO UPDATE SET
    organization_id = EXCLUDED.organization_id, position = EXCLUDED.position, section = EXCLUDED.section,
    description = EXCLUDED.description, unite = EXCLUDED.unite, qty = EXCLUDED.qty,
    montant = EXCLUDED.montant, allocation = EXCLUDED.allocation;

  -- Transactions: append/update only (never deleted — reversal entries only)
  INSERT INTO public.project_transactions (project_id, organization_id, report_index, external_id, code, tx_date, voucher,
    beneficiaire, montant_devise, taux_change, montant_eur, description, attachments)
  SELECT p.id, p.organization_id, (r.ord - 1)::int, t->>'id', COALESCE(t->>'code',''), t->>'date', t->>'voucher', t->>'beneficiaire',
         COALESCE(NULLIF(t->>'montantDevise','')::numeric,0), COALESCE(NULLIF(t->>'tauxChange','')::numeric,0),
         COALESCE(NULLIF(t->>'montantEUR','')::numeric,0), t->>'description', COALESCE(t->'attachments','[]'::jsonb)
  FROM jsonb_array_elements(COALESCE(p.reports,'[]'::jsonb)) WITH ORDINALITY AS r(v, ord),
       jsonb_array_elements(COALESCE(r.v->'transactions','[]'::jsonb)) t
  WHERE COALESCE(t->>'id','') <> ''
  ON CONFLICT (project_id, report_index, external_id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id, code = EXCLUDED.code, tx_date = EXCLUDED.tx_date, voucher = EXCLUDED.voucher,
    beneficiaire = EXCLUDED.beneficiaire, montant_devise = EXCLUDED.montant_devise, taux_change = EXCLUDED.taux_change,
    montant_eur = EXCLUDED.montant_eur, description = EXCLUDED.description, attachments = EXCLUDED.attachments;

  -- Periodic reports: single reference for workflow; only editable states are refreshed
  IF p.organization_id IS NOT NULL THEN
    INSERT INTO public.periodic_reports (project_id, organization_id, report_index, period_start, period_end, status, depenses, previsions, explanation)
    SELECT p.id, p.organization_id, (r.ord - 1)::int, NULLIF(r.v->>'periodeDebut','')::date, NULLIF(r.v->>'periodeFin','')::date, 'draft',
           COALESCE(r.v->'depenses','{}'::jsonb), COALESCE(r.v->'previsions','{}'::jsonb), COALESCE(r.v->'explanation','{}'::jsonb)
    FROM jsonb_array_elements(COALESCE(p.reports,'[]'::jsonb)) WITH ORDINALITY AS r(v, ord)
    ON CONFLICT (project_id, report_index) DO NOTHING;

    UPDATE public.periodic_reports pr SET
      period_start = NULLIF(r.v->>'periodeDebut','')::date, period_end = NULLIF(r.v->>'periodeFin','')::date,
      depenses = COALESCE(r.v->'depenses','{}'::jsonb), previsions = COALESCE(r.v->'previsions','{}'::jsonb),
      explanation = COALESCE(r.v->'explanation','{}'::jsonb)
    FROM jsonb_array_elements(COALESCE(p.reports,'[]'::jsonb)) WITH ORDINALITY AS r(v, ord)
    WHERE pr.project_id = p.id AND pr.report_index = (r.ord - 1)::int AND pr.status IN ('draft','rejected')
      AND (pr.depenses IS DISTINCT FROM COALESCE(r.v->'depenses','{}'::jsonb)
        OR pr.previsions IS DISTINCT FROM COALESCE(r.v->'previsions','{}'::jsonb)
        OR pr.explanation IS DISTINCT FROM COALESCE(r.v->'explanation','{}'::jsonb)
        OR pr.period_start IS DISTINCT FROM NULLIF(r.v->>'periodeDebut','')::date
        OR pr.period_end IS DISTINCT FROM NULLIF(r.v->>'periodeFin','')::date);
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.sync_project_normalized(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_sync_project_normalized()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.budget_lines IS DISTINCT FROM OLD.budget_lines
     OR NEW.reports IS DISTINCT FROM OLD.reports OR NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    PERFORM public.sync_project_normalized(NEW.id);
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.trg_sync_project_normalized() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER sync_project_normalized AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_project_normalized();

-- Backfill
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT id FROM public.projects LOOP PERFORM public.sync_project_normalized(r.id); END LOOP;
END $$;

COMMENT ON COLUMN public.projects.budget_lines IS 'DEPRECATED for reads: mirrored into public.budget_lines by trigger';
COMMENT ON COLUMN public.projects.reports IS 'DEPRECATED for reads: mirrored into public.periodic_reports and public.project_transactions by trigger';