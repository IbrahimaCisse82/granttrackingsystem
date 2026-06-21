
-- =========================================================
-- 1) user_roles: prevent self-elevation (PRIVILEGE_ESCALATION)
-- =========================================================
-- The existing "Admins can manage roles" (FOR ALL) policy only sets USING but no WITH CHECK,
-- and there's no explicit INSERT restriction. Drop and recreate with strict admin-only write policies.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- 2) Storage: scope transaction-attachments to project's org
-- =========================================================
-- Path convention: <project_id>/<reportIndex>/<txId>/<uuid>.<ext>
-- Helper: extract project_id from object name
CREATE OR REPLACE FUNCTION public.storage_object_project_id(_name text)
RETURNS uuid
LANGUAGE sql IMMUTABLE
AS $$
  SELECT NULLIF(split_part(_name, '/', 1), '')::uuid
$$;

DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read transaction attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload transaction attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete own transaction attachments" ON storage.objects;

CREATE POLICY "Org members can read transaction attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'transaction-attachments'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = public.storage_object_project_id(name)
        AND public.is_org_member(auth.uid(), p.organization_id)
    )
  );

CREATE POLICY "Org members can upload transaction attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'transaction-attachments'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = public.storage_object_project_id(name)
        AND public.is_org_member(auth.uid(), p.organization_id)
    )
  );

CREATE POLICY "Owner or org admin can delete transaction attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'transaction-attachments'
    AND (
      auth.uid() = owner
      OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = public.storage_object_project_id(name)
          AND public.is_org_manager_or_admin(auth.uid(), p.organization_id)
      )
    )
  );

-- =========================================================
-- 3) audit_logs: tighten INSERT (project must belong to user's org)
-- =========================================================
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;

CREATE POLICY "Users can insert audit logs for accessible projects"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      project_id IS NULL
      OR project_id IN (
        SELECT p.id FROM public.projects p
        WHERE p.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
      )
    )
  );

-- =========================================================
-- 4) notifications: tighten INSERT (project must belong to user's org)
-- =========================================================
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications for accessible projects"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      project_id IS NULL
      OR project_id IN (
        SELECT p.id FROM public.projects p
        WHERE p.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
      )
    )
  );
