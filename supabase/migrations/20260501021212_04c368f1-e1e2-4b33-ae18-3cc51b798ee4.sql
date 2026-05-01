REVOKE SELECT ON public.projects FROM anon;
REVOKE SELECT ON public.organizations FROM anon;
REVOKE SELECT ON public.organization_members FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.comments FROM anon;
REVOKE SELECT ON public.notifications FROM anon;
REVOKE SELECT ON public.audit_logs FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_org_ids(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_organization(text, text, text) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

UPDATE storage.buckets SET public = false WHERE id = 'transaction-attachments';

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view transaction attachments" ON storage.objects;

CREATE POLICY "Authenticated can read transaction attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'transaction-attachments');

CREATE POLICY "Authenticated can upload transaction attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'transaction-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete own transaction attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'transaction-attachments' AND auth.uid() = owner);