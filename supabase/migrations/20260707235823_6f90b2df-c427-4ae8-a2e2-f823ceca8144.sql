
CREATE TABLE public.project_closure_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  item_label text NOT NULL,
  item_order int NOT NULL DEFAULT 0,
  checked boolean NOT NULL DEFAULT false,
  checked_by uuid REFERENCES auth.users(id),
  checked_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, item_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_closure_checklists TO authenticated;
GRANT ALL ON public.project_closure_checklists TO service_role;

ALTER TABLE public.project_closure_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can view closure items"
  ON public.project_closure_checklists FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org members can insert closure items"
  ON public.project_closure_checklists FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org members can update closure items"
  ON public.project_closure_checklists FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org managers can delete closure items"
  ON public.project_closure_checklists FOR DELETE TO authenticated
  USING (public.is_org_manager_or_admin(auth.uid(), organization_id));

CREATE TRIGGER update_closure_updated_at BEFORE UPDATE ON public.project_closure_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_closure_changes AFTER INSERT OR UPDATE OR DELETE ON public.project_closure_checklists
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- Seed function: creates standard items for a project
CREATE OR REPLACE FUNCTION public.seed_closure_checklist(_project_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org_id uuid;
BEGIN
  SELECT organization_id INTO _org_id FROM public.projects WHERE id = _project_id;
  IF _org_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.project_closure_checklists (project_id, organization_id, item_key, item_label, item_order)
  VALUES
    (_project_id, _org_id, 'final_report', 'Rapport final soumis et approuvé', 10),
    (_project_id, _org_id, 'expenses_reconciled', 'Dépenses réconciliées avec les fiches de versement', 20),
    (_project_id, _org_id, 'vouchers_reconciled', 'Fiches de versement rapprochées avec les relevés bancaires', 30),
    (_project_id, _org_id, 'asset_inventory', 'Inventaire des actifs acquis complété', 40),
    (_project_id, _org_id, 'external_audit', 'Rapport d''audit externe reçu', 50),
    (_project_id, _org_id, 'lessons_learned', 'Leçons apprises documentées', 60),
    (_project_id, _org_id, 'donor_closure_letter', 'Lettre de clôture bailleur reçue', 70),
    (_project_id, _org_id, 'beneficiary_handover', 'Transfert aux bénéficiaires ou partenaires effectué', 80)
  ON CONFLICT (project_id, item_key) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_closure_checklist(uuid) TO authenticated;
