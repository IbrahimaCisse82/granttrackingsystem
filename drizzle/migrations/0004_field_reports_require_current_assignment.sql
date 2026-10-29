DROP POLICY IF EXISTS "View field reports" ON public.field_reports;
CREATE POLICY "View field reports" ON public.field_reports FOR SELECT TO authenticated
USING (((beneficiary_id = auth.uid()) AND public.is_project_beneficiary(auth.uid(), project_id)) OR public.is_org_manager_or_admin(auth.uid(), organization_id));
DROP POLICY IF EXISTS "Update field reports" ON public.field_reports;
CREATE POLICY "Update field reports" ON public.field_reports FOR UPDATE TO authenticated
USING (((beneficiary_id = auth.uid()) AND public.is_project_beneficiary(auth.uid(), project_id) AND ((status)::text = ANY (ARRAY['draft','submitted']))) OR public.is_org_manager_or_admin(auth.uid(), organization_id));