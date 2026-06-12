
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identifier, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits (identifier, action, window_start DESC);

GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated/anon: table is service-role only.
CREATE POLICY "service_role_only_select" ON public.rate_limits
  FOR SELECT TO service_role USING (true);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _action text,
  _max integer,
  _window_seconds integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bucket timestamptz;
  _current integer;
BEGIN
  -- Bucket the window: floor(now / window_seconds) * window_seconds
  _bucket := to_timestamp(floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds);

  INSERT INTO public.rate_limits(identifier, action, window_start, count)
  VALUES (_identifier, _action, _bucket, 1)
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO _current;

  -- Cleanup old buckets occasionally (1% chance)
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits
    WHERE window_start < now() - interval '1 day';
  END IF;

  RETURN jsonb_build_object(
    'allowed', _current <= _max,
    'count', _current,
    'max', _max,
    'reset_at', _bucket + (_window_seconds || ' seconds')::interval
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;
