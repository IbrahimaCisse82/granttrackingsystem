
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Only admins can directly insert organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
