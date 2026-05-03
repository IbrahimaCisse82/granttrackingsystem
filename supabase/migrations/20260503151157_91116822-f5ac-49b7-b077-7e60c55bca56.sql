
-- =========================================================
-- G-GTS v1.1 — Priorité 1
-- =========================================================

-- Helper: org membership role check (manager/admin/owner)
CREATE OR REPLACE FUNCTION public.is_org_manager_or_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
      AND role IN ('owner','admin','manager')
  )
$$;

-- 1. Currency on projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS currency varchar(3) NOT NULL DEFAULT 'XOF';

-- 2. exchange_rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_currency varchar(3) NOT NULL,
  to_currency varchar(3) NOT NULL,
  rate numeric(15,6) NOT NULL CHECK (rate > 0),
  rate_date date NOT NULL DEFAULT CURRENT_DATE,
  source varchar(50) NOT NULL DEFAULT 'manual',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_org_pair_date
  ON public.exchange_rates(organization_id, from_currency, to_currency, rate_date DESC);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view rates" ON public.exchange_rates
  FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Managers can insert rates" ON public.exchange_rates
  FOR INSERT TO authenticated
  WITH CHECK (is_org_manager_or_admin(auth.uid(), organization_id) AND auth.uid() = created_by);

CREATE POLICY "Managers can update rates" ON public.exchange_rates
  FOR UPDATE TO authenticated
  USING (is_org_manager_or_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete rates" ON public.exchange_rates
  FOR DELETE TO authenticated
  USING (is_org_admin(auth.uid(), organization_id));

-- 3. periodic_reports
CREATE TABLE IF NOT EXISTS public.periodic_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_index integer NOT NULL,
  period_start date,
  period_end date,
  status varchar(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','approved','rejected','validated')),
  deadline_approval timestamptz,
  depenses jsonb NOT NULL DEFAULT '{}'::jsonb,
  previsions jsonb NOT NULL DEFAULT '{}'::jsonb,
  explanation jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,
  submitted_by uuid,
  approved_at timestamptz,
  approved_by uuid,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, report_index)
);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_org_status
  ON public.periodic_reports(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_project
  ON public.periodic_reports(project_id);

ALTER TABLE public.periodic_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view reports" ON public.periodic_reports
  FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Managers insert reports" ON public.periodic_reports
  FOR INSERT TO authenticated
  WITH CHECK (is_org_manager_or_admin(auth.uid(), organization_id));

CREATE POLICY "Managers update own draft / admins update all" ON public.periodic_reports
  FOR UPDATE TO authenticated
  USING (is_org_manager_or_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins delete reports" ON public.periodic_reports
  FOR DELETE TO authenticated
  USING (is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER trg_periodic_reports_updated_at
  BEFORE UPDATE ON public.periodic_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. payment_vouchers
CREATE TABLE IF NOT EXISTS public.payment_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_id uuid REFERENCES public.periodic_reports(id) ON DELETE SET NULL,
  voucher_number varchar(50) NOT NULL,
  amount_local numeric(15,2) NOT NULL CHECK (amount_local >= 0),
  amount_eur numeric(15,2),
  currency varchar(3) NOT NULL DEFAULT 'XOF',
  exchange_rate numeric(15,6),
  payment_date date NOT NULL,
  donor_reference varchar(100),
  bank_reference varchar(100),
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','received','reconciled')),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_vouchers_project ON public.payment_vouchers(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_vouchers_org_status ON public.payment_vouchers(organization_id, status);

ALTER TABLE public.payment_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view vouchers" ON public.payment_vouchers
  FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Managers create vouchers" ON public.payment_vouchers
  FOR INSERT TO authenticated
  WITH CHECK (is_org_manager_or_admin(auth.uid(), organization_id) AND auth.uid() = created_by);

CREATE POLICY "Managers update vouchers" ON public.payment_vouchers
  FOR UPDATE TO authenticated
  USING (is_org_manager_or_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins delete vouchers" ON public.payment_vouchers
  FOR DELETE TO authenticated
  USING (is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER trg_payment_vouchers_updated_at
  BEFORE UPDATE ON public.payment_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. approval_workflows
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type varchar(30) NOT NULL CHECK (entity_type IN ('periodic_report','amendement','payment_voucher')),
  entity_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  from_status varchar(30),
  to_status varchar(30) NOT NULL,
  reason text,
  actor_id uuid NOT NULL,
  deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_entity
  ON public.approval_workflows(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_org
  ON public.approval_workflows(organization_id, created_at DESC);

ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view workflows" ON public.approval_workflows
  FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Managers insert workflows" ON public.approval_workflows
  FOR INSERT TO authenticated
  WITH CHECK (is_org_manager_or_admin(auth.uid(), organization_id) AND auth.uid() = actor_id);

-- 6. Notification helper on workflow transitions
CREATE OR REPLACE FUNCTION public.notify_on_workflow()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  recipient uuid;
  rep_record record;
BEGIN
  IF NEW.entity_type = 'periodic_report' THEN
    SELECT submitted_by INTO rep_record FROM public.periodic_reports WHERE id = NEW.entity_id;
    IF NEW.to_status = 'submitted' THEN
      -- notify all org admins
      FOR recipient IN
        SELECT user_id FROM public.organization_members
        WHERE organization_id = NEW.organization_id AND role IN ('owner','admin')
      LOOP
        INSERT INTO public.notifications(user_id, type, title, message, project_id)
        VALUES (recipient, 'info', 'Rapport soumis',
          'Un nouveau rapport périodique attend votre approbation.', NEW.project_id);
      END LOOP;
    ELSIF NEW.to_status IN ('approved','rejected') AND rep_record.submitted_by IS NOT NULL THEN
      INSERT INTO public.notifications(user_id, type, title, message, project_id)
      VALUES (rep_record.submitted_by,
        CASE WHEN NEW.to_status = 'approved' THEN 'success' ELSE 'warning' END,
        'Rapport ' || NEW.to_status,
        COALESCE(NEW.reason, 'Décision enregistrée sur votre rapport.'),
        NEW.project_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_workflow_notify
  AFTER INSERT ON public.approval_workflows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_workflow();

-- 7. Audit trigger on payment_vouchers and periodic_reports
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs(user_id, action, project_id, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP || ':' || TG_TABLE_NAME,
    CASE TG_TABLE_NAME
      WHEN 'payment_vouchers' THEN COALESCE(NEW.project_id, OLD.project_id)
      WHEN 'periodic_reports' THEN COALESCE(NEW.project_id, OLD.project_id)
    END,
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_payment_vouchers
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER trg_audit_periodic_reports
  AFTER INSERT OR UPDATE OR DELETE ON public.periodic_reports
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- 8. Backfill currency on existing projects (FCFA -> XOF default already)
UPDATE public.projects SET currency = 'XOF' WHERE currency IS NULL OR currency = '';
