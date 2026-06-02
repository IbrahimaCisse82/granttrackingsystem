-- Tighten UPDATE policy on periodic_reports: managers limited to draft/rejected, admins unrestricted
DROP POLICY IF EXISTS "Managers update own draft / admins update all" ON public.periodic_reports;

CREATE POLICY "Managers update draft or rejected reports"
  ON public.periodic_reports
  FOR UPDATE
  TO authenticated
  USING (
    is_org_manager_or_admin(auth.uid(), organization_id)
    AND (
      is_org_admin(auth.uid(), organization_id)
      OR status IN ('draft', 'rejected')
    )
  )
  WITH CHECK (
    is_org_manager_or_admin(auth.uid(), organization_id)
    AND (
      is_org_admin(auth.uid(), organization_id)
      OR status IN ('draft', 'submitted', 'rejected')
    )
  );