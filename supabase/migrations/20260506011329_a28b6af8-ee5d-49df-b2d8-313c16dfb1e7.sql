-- Attach audit log triggers (function log_audit_change already exists)
DROP TRIGGER IF EXISTS audit_payment_vouchers ON public.payment_vouchers;
CREATE TRIGGER audit_payment_vouchers
AFTER INSERT OR UPDATE OR DELETE ON public.payment_vouchers
FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

DROP TRIGGER IF EXISTS audit_periodic_reports ON public.periodic_reports;
CREATE TRIGGER audit_periodic_reports
AFTER INSERT OR UPDATE OR DELETE ON public.periodic_reports
FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- Workflow notification trigger (function notify_on_workflow already exists)
DROP TRIGGER IF EXISTS notify_workflow_transitions ON public.approval_workflows;
CREATE TRIGGER notify_workflow_transitions
AFTER INSERT ON public.approval_workflows
FOR EACH ROW EXECUTE FUNCTION public.notify_on_workflow();

-- Enable scheduling extensions for deadline reminders
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to insert reminder notifications 48h before deadline
CREATE OR REPLACE FUNCTION public.send_report_deadline_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rep record;
  recipient uuid;
BEGIN
  FOR rep IN
    SELECT pr.* FROM public.periodic_reports pr
    WHERE pr.status = 'draft'
      AND pr.deadline_approval IS NOT NULL
      AND pr.deadline_approval BETWEEN now() AND now() + interval '48 hours'
  LOOP
    FOR recipient IN
      SELECT user_id FROM public.organization_members
      WHERE organization_id = rep.organization_id AND role IN ('owner','admin','manager')
    LOOP
      -- Avoid duplicate reminder within 24h
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = recipient AND project_id = rep.project_id
          AND type = 'warning' AND title = 'Échéance rapport dans 48h'
          AND created_at > now() - interval '24 hours'
      ) THEN
        INSERT INTO public.notifications(user_id, type, title, message, project_id)
        VALUES (recipient, 'warning', 'Échéance rapport dans 48h',
          'Un rapport périodique est encore en brouillon et doit être soumis avant la deadline.',
          rep.project_id);
      END IF;
    END LOOP;
  END LOOP;
END;
$$;