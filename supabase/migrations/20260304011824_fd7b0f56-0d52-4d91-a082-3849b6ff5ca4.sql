
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  convention text NOT NULL DEFAULT '',
  org text NOT NULL DEFAULT '',
  org_type text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  pays text NOT NULL DEFAULT '',
  devise text NOT NULL DEFAULT 'FCFA',
  taux numeric NOT NULL DEFAULT 655.957,
  risque text NOT NULL DEFAULT '',
  debut text NOT NULL DEFAULT '',
  fin text NOT NULL DEFAULT '',
  periodicite text NOT NULL DEFAULT '',
  color jsonb NOT NULL DEFAULT '{"stripe":"#005B99","badge":"b-blue"}'::jsonb,
  budget_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  reports jsonb NOT NULL DEFAULT '[]'::jsonb,
  fiches jsonb NOT NULL DEFAULT '{"versements":[]}'::jsonb,
  amendements jsonb NOT NULL DEFAULT '[]'::jsonb,
  infos jsonb NOT NULL DEFAULT '{"submitDate":"","preparedBy":"","version":"","scoreRisque":""}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read projects (adjust as needed)
CREATE POLICY "Authenticated users can view projects"
  ON public.projects FOR SELECT TO authenticated
  USING (true);

-- Users can insert their own projects
CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects, admins/managers can update all
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Users can delete their own projects, admins can delete all
CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
