
CREATE OR REPLACE FUNCTION public.get_burn_rate_analysis(_org_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH filtered AS (
    SELECT * FROM public.projects p
    WHERE COALESCE(p.archived, false) = false
      AND (_org_id IS NULL OR p.organization_id = _org_id)
      AND p.debut IS NOT NULL AND p.fin IS NOT NULL
      AND p.debut <> '' AND p.fin <> ''
  ),
  budget_totals AS (
    SELECT f.id AS project_id,
      SUM(COALESCE((l->>'qty')::numeric,0) * COALESCE((l->>'montant')::numeric,0) * COALESCE((l->>'allocation')::numeric,100)/100) AS budget_total
    FROM filtered f, LATERAL jsonb_array_elements(COALESCE(f.budget_lines,'[]'::jsonb)) l
    GROUP BY f.id
  ),
  depense_totals AS (
    SELECT f.id AS project_id,
      SUM(COALESCE((SELECT SUM((value)::numeric) FROM jsonb_each_text(COALESCE(r->'depenses','{}'::jsonb))),0)) AS depenses_total
    FROM filtered f, LATERAL jsonb_array_elements(COALESCE(f.reports,'[]'::jsonb)) r
    GROUP BY f.id
  ),
  metrics AS (
    SELECT
      f.id,
      f.org,
      f.title,
      f.debut::date AS debut,
      f.fin::date AS fin,
      COALESCE(bt.budget_total,0) AS budget_total,
      COALESCE(dt.depenses_total,0) AS depenses_total,
      GREATEST(1, (f.fin::date - f.debut::date))::numeric AS duration_days,
      GREATEST(0, LEAST((f.fin::date - f.debut::date), (CURRENT_DATE - f.debut::date)))::numeric AS elapsed_days
    FROM filtered f
    LEFT JOIN budget_totals bt ON bt.project_id = f.id
    LEFT JOIN depense_totals dt ON dt.project_id = f.id
  ),
  computed AS (
    SELECT
      id, org, title, debut, fin, budget_total, depenses_total,
      ROUND((elapsed_days / duration_days) * 100, 1) AS elapsed_pct,
      CASE WHEN budget_total > 0 THEN ROUND((depenses_total / budget_total) * 100, 1) ELSE 0 END AS burn_pct,
      CASE
        WHEN depenses_total > 0 AND elapsed_days > 0
        THEN (debut + ((budget_total / (depenses_total / elapsed_days))::int || ' days')::interval)::date
        ELSE NULL
      END AS forecast_end
    FROM metrics
  )
  SELECT jsonb_build_object(
    'projects', COALESCE(jsonb_agg(jsonb_build_object(
      'id', id,
      'org', org,
      'title', title,
      'debut', debut,
      'fin', fin,
      'budget_total', budget_total,
      'depenses_total', depenses_total,
      'elapsed_pct', elapsed_pct,
      'burn_pct', burn_pct,
      'variance', ROUND(burn_pct - elapsed_pct, 1),
      'forecast_end', forecast_end,
      'status', CASE
        WHEN burn_pct - elapsed_pct > 15 THEN 'over'
        WHEN burn_pct - elapsed_pct < -15 THEN 'under'
        ELSE 'on_track'
      END
    ) ORDER BY ABS(burn_pct - elapsed_pct) DESC), '[]'::jsonb),
    'alertCount', COUNT(*) FILTER (WHERE ABS(burn_pct - elapsed_pct) > 15)
  ) INTO result FROM computed;
  RETURN result;
END;
$$;
