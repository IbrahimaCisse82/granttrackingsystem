-- Add version column for optimistic locking
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- Trigger: check expected version (when provided) and auto-increment
CREATE OR REPLACE FUNCTION public.projects_version_check()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- If client sends a version different from current OLD.version, reject (conflict)
  IF NEW.version IS DISTINCT FROM OLD.version AND NEW.version <> OLD.version + 1 THEN
    IF NEW.version <> OLD.version THEN
      RAISE EXCEPTION 'Conflit de version : ce projet a été modifié par un autre utilisateur. Rechargez la page.'
        USING ERRCODE = 'serialization_failure';
    END IF;
  END IF;
  -- Always auto-increment to OLD.version + 1
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_version_check_trg ON public.projects;
CREATE TRIGGER projects_version_check_trg
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.projects_version_check();