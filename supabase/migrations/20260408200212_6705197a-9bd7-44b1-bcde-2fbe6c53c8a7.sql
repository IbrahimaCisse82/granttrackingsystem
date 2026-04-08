
ALTER TABLE public.projects
ADD COLUMN indicators jsonb NOT NULL DEFAULT '[]'::jsonb;
