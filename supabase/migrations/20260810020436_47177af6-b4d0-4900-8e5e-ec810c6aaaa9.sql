-- Fix mutable search_path on trigger/helper functions
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $function$
BEGIN
  RAISE EXCEPTION 'audit_logs is immutable (WORM): % not allowed', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$function$;

CREATE OR REPLACE FUNCTION public.storage_object_project_id(_name text)
RETURNS uuid LANGUAGE sql IMMUTABLE SET search_path = public AS $function$
  SELECT NULLIF(split_part(_name, '/', 1), '')::uuid
$function$;

-- Trigger-only / internal functions must not be callable from the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.log_audit_change() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_workflow() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_audit_log_mutation() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.projects_version_check() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.send_report_deadline_reminders() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_org_ids(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_manager_or_admin(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_project_beneficiary(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_organization(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.seed_closure_checklist(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_metrics(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_burn_rate_analysis(uuid) FROM anon;