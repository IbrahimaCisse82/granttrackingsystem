-- 1. Immutability of audit_logs: revoke UPDATE/DELETE from all client roles
REVOKE UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

-- Explicit deny policies (defense in depth) — no policy = no access under RLS, but make it explicit
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='Audit logs are immutable - no update') THEN
    CREATE POLICY "Audit logs are immutable - no update"
      ON public.audit_logs FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='Audit logs are immutable - no delete') THEN
    CREATE POLICY "Audit logs are immutable - no delete"
      ON public.audit_logs FOR DELETE TO authenticated USING (false);
  END IF;
END $$;

-- DB-level trigger that blocks UPDATE / DELETE even for service_role from the SQL editor
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is immutable (WORM): % not allowed', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_no_update ON public.audit_logs;
CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS audit_logs_no_delete ON public.audit_logs;
CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- 2. Generic SECURITY DEFINER trigger function that resolves project_id from the row
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project_id uuid := NULL;
  _row jsonb;
BEGIN
  _row := COALESCE(to_jsonb(NEW), to_jsonb(OLD));
  IF _row ? 'project_id' THEN
    _project_id := NULLIF(_row->>'project_id','')::uuid;
  ELSIF TG_TABLE_NAME = 'projects' THEN
    _project_id := COALESCE((to_jsonb(NEW)->>'id')::uuid, (to_jsonb(OLD)->>'id')::uuid);
  END IF;

  INSERT INTO public.audit_logs(user_id, action, project_id, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP || ':' || TG_TABLE_NAME,
    _project_id,
    jsonb_build_object(
      'op', TG_OP,
      'table', TG_TABLE_NAME,
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'at', now()
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Attach audit triggers to all sensitive tables (INSERT/UPDATE/DELETE)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'projects',
    'periodic_reports',
    'payment_vouchers',
    'field_reports',
    'approval_workflows',
    'donor_report_templates',
    'donor_report_runs',
    'amendements'::text, -- guarded below
    'exchange_rates',
    'project_beneficiaries',
    'user_roles',
    'organization_members',
    'organizations'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', t, t);
      EXECUTE format('CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_change()', t, t);
    END IF;
  END LOOP;
END $$;

-- 4. Service role keeps INSERT for backfills; everyone else only INSERT via triggers (definer)
GRANT INSERT ON public.audit_logs TO service_role;
GRANT SELECT ON public.audit_logs TO authenticated;