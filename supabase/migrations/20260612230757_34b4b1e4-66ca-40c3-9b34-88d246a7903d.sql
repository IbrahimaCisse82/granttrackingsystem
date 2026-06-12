
CREATE TABLE IF NOT EXISTS public.client_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  severity text NOT NULL DEFAULT 'error' CHECK (severity IN ('info','warning','error','fatal')),
  message text NOT NULL,
  stack text,
  url text,
  user_agent text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  app_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_errors_created ON public.client_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_errors_user ON public.client_errors (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_errors_severity ON public.client_errors (severity, created_at DESC);

GRANT SELECT, INSERT ON public.client_errors TO authenticated;
GRANT ALL ON public.client_errors TO service_role;

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own errors (or anonymous if user_id is null)
CREATE POLICY "users_insert_own_errors" ON public.client_errors
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Only global admins can read errors
CREATE POLICY "admins_select_errors" ON public.client_errors
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only global admins can delete (cleanup)
CREATE POLICY "admins_delete_errors" ON public.client_errors
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
