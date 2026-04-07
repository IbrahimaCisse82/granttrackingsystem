
-- 1. Audit trail table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for accessible projects"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_audit_logs_project ON public.audit_logs(project_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);

-- 2. Archived column on projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- 3. Comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  report_index integer NOT NULL DEFAULT 0,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
  ON public.comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert comments"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
