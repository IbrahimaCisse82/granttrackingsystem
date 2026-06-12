import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { checkRateLimit, getIdentifier, rateLimitResponse } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateBody {
  action: 'check_transaction' | 'check_project_delete';
  project_id: string;
  transaction_date?: string;
  amount_eur?: number;
  budget_code?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Non authentifié', code: 'AUTH_REQUIRED' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } }
    );

    const { data: { user: caller } } = await supabase.auth.getUser();

    // Rate limit: max 120 validation calls per minute per user/IP
    const rl = await checkRateLimit(getIdentifier(req, caller?.id), 'validate-operation', 120, 60);
    if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

    const body: ValidateBody = await req.json();
    if (!body.project_id || !body.action) return json({ error: 'Paramètres manquants', code: 'BAD_REQUEST' }, 400);

    const { data: project, error } = await supabase
      .from('projects').select('id, debut, fin, archived, budget_lines, reports').eq('id', body.project_id).single();
    if (error || !project) return json({ error: 'Projet introuvable', code: 'PROJECT_NOT_FOUND' }, 404);

    if (project.archived) return json({ error: 'Projet archivé — opération bloquée', code: 'PROJECT_ARCHIVED' }, 422);

    if (body.action === 'check_project_delete') {
      const reports = (project.reports as any[]) || [];
      const hasTx = reports.some(r => Array.isArray(r.transactions) && r.transactions.length > 0);
      if (hasTx) return json({ error: 'Suppression interdite : le projet contient des transactions', code: 'PROJECT_HAS_TRANSACTIONS' }, 422);
      return json({ ok: true });
    }

    if (body.action === 'check_transaction') {
      if (body.transaction_date && project.debut && project.fin) {
        const td = new Date(body.transaction_date).getTime();
        const start = new Date(project.debut).getTime();
        const end = new Date(project.fin).getTime();
        if (!isNaN(td) && !isNaN(start) && !isNaN(end) && (td < start || td > end)) {
          return json({ error: `Date hors période (${project.debut} → ${project.fin})`, code: 'DATE_OUT_OF_RANGE' }, 422);
        }
      }
      if (body.budget_code) {
        const lines = (project.budget_lines as any[]) || [];
        const line = lines.find(l => l.code === body.budget_code);
        if (!line) return json({ error: 'Ligne budgétaire inexistante', code: 'BUDGET_LINE_NOT_FOUND' }, 422);
        if (line.locked) return json({ error: 'Ligne budgétaire verrouillée', code: 'BUDGET_LINE_LOCKED' }, 422);
      }
      return json({ ok: true });
    }

    return json({ error: 'Action inconnue', code: 'UNKNOWN_ACTION' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message, code: 'INTERNAL_ERROR' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
