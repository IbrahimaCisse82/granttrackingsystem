
-- Fix audit_logs: filter by organization via project
DROP POLICY IF EXISTS "Users can view audit logs for accessible projects" ON public.audit_logs;
CREATE POLICY "Users can view org audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    project_id IS NULL AND user_id = auth.uid()
    OR project_id IN (
      SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

-- Fix comments: filter by organization via project
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.comments;
CREATE POLICY "Members can view org comments"
  ON public.comments FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

-- Fix comments INSERT: ensure project belongs to user's org
DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;
CREATE POLICY "Users can insert org comments"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND project_id IN (
      SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

-- Fix projects UPDATE: add org membership check
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Org members can update projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (
    (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
    AND (organization_id IS NULL OR is_org_member(auth.uid(), organization_id))
  );

-- Allow org members to see each other's profiles
CREATE POLICY "Org members can view member profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT om.user_id FROM public.organization_members om
      WHERE om.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );
