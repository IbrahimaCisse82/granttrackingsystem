CREATE OR REPLACE FUNCTION public.enforce_report_four_eyes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IN ('approved','rejected','validated') AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF auth.uid() IS NOT NULL AND OLD.submitted_by = auth.uid() THEN
      RAISE EXCEPTION 'Séparation des tâches : vous ne pouvez pas approuver ou rejeter votre propre rapport.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.status = 'approved' THEN
      NEW.approved_by := COALESCE(auth.uid(), NEW.approved_by);
      NEW.approved_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enforce_report_four_eyes() FROM anon, authenticated;
CREATE TRIGGER trg_periodic_reports_four_eyes BEFORE UPDATE ON public.periodic_reports
  FOR EACH ROW EXECUTE FUNCTION public.enforce_report_four_eyes();

DROP TRIGGER IF EXISTS trg_audit_payment_vouchers ON public.payment_vouchers;
DROP TRIGGER IF EXISTS trg_audit_periodic_reports ON public.periodic_reports;
DROP TRIGGER IF EXISTS trg_workflow_notify ON public.approval_workflows;