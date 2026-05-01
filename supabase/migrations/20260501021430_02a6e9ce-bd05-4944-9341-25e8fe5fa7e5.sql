CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(
  _org_id uuid DEFAULT NULL,
  _pays text DEFAULT NULL,
  _periodicite text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH filtered AS (
    SELECT *
    FROM public.projects p
    WHERE COALESCE(p.archived, false) = false
      AND (_org_id IS NULL OR p.organization_id = _org_id)
      AND (_pays IS NULL OR p.pays = _pays)
      AND (_periodicite IS NULL OR p.periodicite = _periodicite)
  ),
  budget_lines_expanded AS (
    SELECT
      f.id AS project_id,
      f.org,
      l->>'section' AS section,
      COALESCE((l->>'qty')::numeric, 0)
        * COALESCE((l->>'montant')::numeric, 0)
        * COALESCE((l->>'allocation')::numeric, 100) / 100 AS line_total
    FROM filtered f,
         LATERAL jsonb_array_elements(COALESCE(f.budget_lines, '[]'::jsonb)) AS l
  ),
  project_budgets AS (
    SELECT project_id, org, SUM(line_total) AS budget_total
    FROM budget_lines_expanded
    GROUP BY project_id, org
  ),
  reports_expanded AS (
    SELECT
      f.id AS project_id,
      r->>'status' AS status,
      r->>'periodeDebut' AS periode,
      COALESCE((
        SELECT SUM((value)::numeric)
        FROM jsonb_each_text(COALESCE(r->'depenses', '{}'::jsonb))
      ), 0) AS depenses_total
    FROM filtered f,
         LATERAL jsonb_array_elements(COALESCE(f.reports, '[]'::jsonb)) AS r
  ),
  project_depenses AS (
    SELECT project_id, SUM(depenses_total) AS depenses_total
    FROM reports_expanded
    GROUP BY project_id
  ),
  bailleurs_expanded AS (
    SELECT
      COALESCE(NULLIF(b->>'nom', ''), 'Inconnu') AS nom,
      COALESCE((b->>'contribution')::numeric, 0) AS contribution
    FROM filtered f,
         LATERAL jsonb_array_elements(COALESCE(f.bailleurs, '[]'::jsonb)) AS b
  )
  SELECT jsonb_build_object(
    'totalProjects', (SELECT COUNT(*) FROM filtered),
    'totalBudget', COALESCE((SELECT SUM(budget_total) FROM project_budgets), 0),
    'totalDepenses', COALESCE((SELECT SUM(depenses_total) FROM project_depenses), 0),
    'totalRapports', COALESCE((SELECT COUNT(*) FROM reports_expanded WHERE status IN ('soumis','valide')), 0),
    'sectionData', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'value', value)), '[]'::jsonb)
      FROM (
        SELECT
          CASE WHEN section = 'A' THEN 'Coûts opérationnels (A)' ELSE 'Frais de gestion (B)' END AS name,
          ROUND(SUM(line_total))::numeric AS value
        FROM budget_lines_expanded
        WHERE section IN ('A','B')
        GROUP BY section
        HAVING SUM(line_total) > 0
      ) s
    ),
    'riskData', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'value', value)), '[]'::jsonb)
      FROM (
        SELECT COALESCE(NULLIF(risque, ''), 'Non défini') AS name, COUNT(*) AS value
        FROM filtered
        GROUP BY 1
      ) r
    ),
    'bailleurData', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', nom, 'value', value)), '[]'::jsonb)
      FROM (
        SELECT nom, ROUND(SUM(contribution))::numeric AS value
        FROM bailleurs_expanded
        GROUP BY nom
        HAVING SUM(contribution) > 0
        ORDER BY value DESC
        LIMIT 20
      ) b
    ),
    'budgetByProject', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', CASE WHEN length(org) > 15 THEN substring(org, 1, 15) || '…' ELSE org END,
        'budget', ROUND(COALESCE(pb.budget_total, 0))::numeric,
        'depenses', ROUND(COALESCE(pd.depenses_total, 0))::numeric
      )), '[]'::jsonb)
      FROM filtered f
      LEFT JOIN project_budgets pb ON pb.project_id = f.id
      LEFT JOIN project_depenses pd ON pd.project_id = f.id
    ),
    'timelineData', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('periode', periode, 'depenses', depenses) ORDER BY periode), '[]'::jsonb)
      FROM (
        SELECT periode, SUM(depenses_total) AS depenses
        FROM reports_expanded
        WHERE periode IS NOT NULL AND periode <> ''
        GROUP BY periode
      ) t
    ),
    'countries', (
      SELECT COALESCE(jsonb_agg(DISTINCT pays ORDER BY pays), '[]'::jsonb)
      FROM filtered
      WHERE pays IS NOT NULL AND pays <> ''
    )
  ) INTO result;

  RETURN result;
END;
$$;