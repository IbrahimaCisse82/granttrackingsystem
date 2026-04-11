
-- 1. Create atomic function for org creation
CREATE OR REPLACE FUNCTION public.create_organization(_name text, _slug text, _description text DEFAULT '')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org_id uuid;
BEGIN
  INSERT INTO public.organizations (name, slug, description)
  VALUES (_name, _slug, _description)
  RETURNING id INTO _org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (_org_id, auth.uid(), 'owner');

  -- Set as active org in profile
  UPDATE public.profiles SET active_organization_id = _org_id WHERE user_id = auth.uid();

  RETURN _org_id;
END;
$$;

-- 2. Fix the organization_members INSERT policy (self-referencing bug)
DROP POLICY IF EXISTS "Org admins can insert members" ON public.organization_members;
CREATE POLICY "Org admins can insert members"
  ON public.organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    is_org_admin(auth.uid(), organization_id)
  );

-- 3. Allow the create_organization function to work by relaxing the organizations INSERT policy
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);
