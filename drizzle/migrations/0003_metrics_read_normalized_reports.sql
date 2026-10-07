CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(_org_id uuid DEFAULT NULL::uuid, _pays text DEFAULT NULL::text, _periodicite text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path TO 'public'
AS $function$
DECLARE result jsonb;
BEGIN
  WITH filtered AS (
    SELECT * FROM public.projects p
    WHERE COALESCE(p.archived, false) = false
      AND (_org_id IS NULL OR p.organization_id = _org_id)
      AND (_pays IS NULL OR p.pays = _pays)
      AND (_periodicite IS NULL OR p.periodicite = _periodicite)
  ),
  budget_lines_expanded AS (
    SELECT b.project_id, b.section, b.qty * b.montant * b.allocation / 100 AS line_total
    FROM public.budget_lines b JOIN filtered f ON f.id = b.project_id
  ),
  project_budgets AS (SELECT project_id, SUM(line_total) AS budget_total FROM budget_lines_expanded GROUP BY project_id),
  reports_expanded AS (
    SELECT pr.project_id, pr.status, to_char(pr.period_start,'YYYY-MM-DD') AS periode,
      COALESCE((SELECT SUM(NULLIF(value,'')::numeric) FROM jsonb_each_text(COALESCE(pr.depenses,'{}'::jsonb))),0) AS depenses_total
    FROM public.periodic_reports pr JOIN filtered f ON f.id = pr.project_id
  ),
  project_depenses AS (SELECT project_id, SUM(depenses_total) AS depenses_total FROM reports_expanded GROUP BY project_id),
  bailleurs_expanded AS (
    SELECT COALESCE(NULLIF(b->>'nom',''),'Inconnu') AS nom, COALESCE(NULLIF(b->>'contribution','')::numeric,0) AS contribution
    FROM filtered f, LATERAL jsonb_array_elements(COALESCE(f.bailleurs,'[]'::jsonb)) AS b
  )
  SELECT jsonb_build_object(
    'totalProjects', (SELECT COUNT(*) FROM filtered),
    'totalBudget', COALESCE((SELECT SUM(budget_total) FROM project_budgets),0),
    'totalDepenses', COALESCE((SELECT SUM(depenses_total) FROM project_depenses),0),
    'totalRapports', COALESCE((SELECT COUNT(*) FROM reports_expanded WHERE status IN ('submitted','approved','validated','soumis','valide')),0),
    'sectionData', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name',name,'value',value)),'[]'::jsonb) FROM (
        SELECT CASE WHEN section='A' THEN 'Coûts opérationnels (A)' ELSE 'Frais de gestion (B)' END AS name, ROUND(SUM(line_total))::numeric AS value
        FROM budget_lines_expanded WHERE section IN ('A','B') GROUP BY section HAVING SUM(line_total) > 0) s),
    'riskData', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name',name,'value',value)),'[]'::jsonb) FROM (
        SELECT COALESCE(NULLIF(risque,''),'Non défini') AS name, COUNT(*) AS value FROM filtered GROUP BY 1) r),
    'bailleurData', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name',nom,'value',value)),'[]'::jsonb) FROM (
        SELECT nom, ROUND(SUM(contribution))::numeric AS value FROM bailleurs_expanded GROUP BY nom HAVING SUM(contribution) > 0 ORDER BY value DESC LIMIT 20) b),
    'budgetByProject', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', CASE WHEN length(f.org) > 15 THEN substring(f.org,1,15)||'…' ELSE f.org END,
        'budget', ROUND(COALESCE(pb.budget_total,0))::numeric,
        'depenses', ROUND(COALESCE(pd.depenses_total,0))::numeric)),'[]'::jsonb)
      FROM filtered f LEFT JOIN project_budgets pb ON pb.project_id=f.id LEFT JOIN project_depenses pd ON pd.project_id=f.id),
    'timelineData', (SELECT COALESCE(jsonb_agg(jsonb_build_object('periode',periode,'depenses',depenses) ORDER BY periode),'[]'::jsonb) FROM (
        SELECT periode, SUM(depenses_total) AS depenses FROM reports_expanded WHERE periode IS NOT NULL GROUP BY periode) t),
    'countries', (SELECT COALESCE(jsonb_agg(DISTINCT pays ORDER BY pays),'[]'::jsonb) FROM filtered WHERE pays IS NOT NULL AND pays <> '')
  ) INTO result;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_burn_rate_analysis(_org_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path TO 'public'
AS $function$
DECLARE result jsonb;
BEGIN
  WITH filtered AS (
    SELECT * FROM public.projects p
    WHERE COALESCE(p.archived,false) = false AND (_org_id IS NULL OR p.organization_id = _org_id)
      AND p.debut IS NOT NULL AND p.fin IS NOT NULL AND p.debut <> '' AND p.fin <> ''
  ),
  budget_totals AS (
    SELECT b.project_id, SUM(b.qty * b.montant * b.allocation / 100) AS budget_total
    FROM public.budget_lines b JOIN filtered f ON f.id = b.project_id GROUP BY b.project_id
  ),
  depense_totals AS (
    SELECT pr.project_id,
      SUM(COALESCE((SELECT SUM(NULLIF(value,'')::numeric) FROM jsonb_each_text(COALESCE(pr.depenses,'{}'::jsonb))),0)) AS depenses_total
    FROM public.periodic_reports pr JOIN filtered f ON f.id = pr.project_id GROUP BY pr.project_id
  ),
  metrics AS (
    SELECT f.id, f.org, f.title, f.debut::date AS debut, f.fin::date AS fin,
      COALESCE(bt.budget_total,0) AS budget_total, COALESCE(dt.depenses_total,0) AS depenses_total,
      GREATEST(1,(f.fin::date - f.debut::date))::numeric AS duration_days,
      GREATEST(0, LEAST((f.fin::date - f.debut::date),(CURRENT_DATE - f.debut::date)))::numeric AS elapsed_days
    FROM filtered f LEFT JOIN budget_totals bt ON bt.project_id=f.id LEFT JOIN depense_totals dt ON dt.project_id=f.id
  ),
  computed AS (
    SELECT id, org, title, debut, fin, budget_total, depenses_total,
      ROUND((elapsed_days/duration_days)*100,1) AS elapsed_pct,
      CASE WHEN budget_total > 0 THEN ROUND((depenses_total/budget_total)*100,1) ELSE 0 END AS burn_pct,
      CASE WHEN depenses_total > 0 AND elapsed_days > 0
        THEN (debut + ((budget_total/(depenses_total/elapsed_days))::int || ' days')::interval)::date END AS forecast_end
    FROM metrics
  )
  SELECT jsonb_build_object(
    'projects', COALESCE(jsonb_agg(jsonb_build_object('id',id,'org',org,'title',title,'debut',debut,'fin',fin,
      'budget_total',budget_total,'depenses_total',depenses_total,'elapsed_pct',elapsed_pct,'burn_pct',burn_pct,
      'variance',ROUND(burn_pct-elapsed_pct,1),'forecast_end',forecast_end,
      'status', CASE WHEN burn_pct-elapsed_pct > 15 THEN 'over' WHEN burn_pct-elapsed_pct < -15 THEN 'under' ELSE 'on_track' END
    ) ORDER BY ABS(burn_pct-elapsed_pct) DESC),'[]'::jsonb),
    'alertCount', COUNT(*) FILTER (WHERE ABS(burn_pct-elapsed_pct) > 15)
  ) INTO result FROM computed;
  RETURN result;
END;
$function$;