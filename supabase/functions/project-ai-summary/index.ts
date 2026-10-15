import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const Body = z.object({
  project_id: z.string().uuid(),
  report_indexes: z.array(z.number().int().min(0).max(50)).min(1).max(24),
  lang: z.enum(['fr', 'en']).default('fr'),
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const sumObj = (o: Record<string, unknown> | null) =>
  Object.values(o ?? {}).reduce<number>((s, v) => s + (Number(v) || 0), 0);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Non authentifié' }, 401);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Non authentifié' }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: 'Paramètres invalides' }, 400);
    const { project_id, report_indexes, lang } = parsed.data;

    // RLS scopes every read to the caller's organizations.
    const { data: project } = await supabase.from('projects')
      .select('id, title, org, pays, devise, debut, fin, periodicite, organization_id, indicators')
      .eq('id', project_id).maybeSingle();
    if (!project) return json({ error: 'Projet introuvable' }, 404);

    const { data: roleOk } = await supabase.rpc('is_org_manager_or_admin', {
      _user_id: user.id, _org_id: project.organization_id,
    });
    if (!roleOk) return json({ error: 'Réservé aux responsables (Manager/Admin)' }, 403);

    const [{ data: lines }, { data: reports }, { data: txs }, { data: risks }] = await Promise.all([
      supabase.from('budget_lines').select('code, section, description, qty, montant, allocation').eq('project_id', project_id),
      supabase.from('periodic_reports').select('report_index, status, period_start, period_end, depenses, previsions, explanation, rejection_reason')
        .eq('project_id', project_id).in('report_index', report_indexes).order('report_index'),
      supabase.from('project_transactions').select('report_index, code, montant_eur, montant_devise')
        .eq('project_id', project_id).in('report_index', report_indexes),
      supabase.from('project_risks').select('category, description, score, status, mitigation').eq('project_id', project_id),
    ]);

    const budgetByCode: Record<string, number> = {};
    for (const l of lines ?? []) budgetByCode[l.code] = Number(l.qty) * Number(l.montant) * Number(l.allocation) / 100;
    const budgetTotal = Object.values(budgetByCode).reduce((a, b) => a + b, 0);
    const spentByCode: Record<string, number> = {};
    for (const r of reports ?? []) for (const [k, v] of Object.entries((r.depenses as Record<string, unknown>) ?? {}))
      spentByCode[k] = (spentByCode[k] ?? 0) + (Number(v) || 0);
    const spentTotal = Object.values(spentByCode).reduce((a, b) => a + b, 0);

    const facts = {
      projet: { titre: project.title, partenaire: project.org, pays: project.pays, devise: project.devise, debut: project.debut, fin: project.fin, periodicite: project.periodicite },
      budget_total: Math.round(budgetTotal),
      depenses_periodes_selectionnees: Math.round(spentTotal),
      taux_consommation_pct: budgetTotal > 0 ? Math.round((spentTotal / budgetTotal) * 1000) / 10 : null,
      lignes: (lines ?? []).map((l) => ({ code: l.code, poste: l.description, budget: Math.round(budgetByCode[l.code] ?? 0), depense: Math.round(spentByCode[l.code] ?? 0) })),
      rapports: (reports ?? []).map((r) => ({ periode: r.report_index + 1, statut: r.status, debut: r.period_start, fin: r.period_end, depenses: Math.round(sumObj(r.depenses as never)), explications: r.explanation, motif_rejet: r.rejection_reason })),
      transactions: { nombre: txs?.length ?? 0, total_eur: Math.round((txs ?? []).reduce((s, t) => s + Number(t.montant_eur || 0), 0)) },
      indicateurs: project.indicators,
      risques: risks ?? [],
    };

    const instructions = lang === 'en'
      ? 'You are a senior grant manager. Using ONLY the JSON data provided, write a concise report in English with Markdown headings: "Progress", "Spending", "Points of attention", "Recommendations". Cite figures. Flag overspent lines (>100%), lines with no spending, rejected reports, high risks (score >15) and missing data. Never invent figures. Max ~400 words.'
      : 'Tu es un Grant Manager senior. En utilisant UNIQUEMENT les données JSON fournies, rédige une synthèse concise en français avec des titres Markdown : « Avancement », « Dépenses », « Points de vigilance », « Recommandations ». Cite les chiffres. Signale les lignes en dépassement (>100 %), les lignes sans dépense, les rapports rejetés, les risques élevés (score >15) et les données manquantes. N\'invente aucun chiffre. ~400 mots maximum.';

    const upstream = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      signal: req.signal,
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': Deno.env.get('LOVABLE_API_KEY')!, 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        instructions,
        input: JSON.stringify(facts),
        stream: true,
        store: false,
        reasoning: { effort: 'low', summary: 'auto' },
        include: ['reasoning.encrypted_content'],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text();
      let message = 'Erreur du service IA';
      try { message = JSON.parse(txt)?.error?.message ?? JSON.parse(txt)?.message ?? message; } catch { /* ignore */ }
      if (upstream.status === 402) message = 'Crédits IA épuisés — ajoutez des crédits à l\'espace de travail.';
      if (upstream.status === 429) message = 'Trop de demandes, réessayez dans un instant.';
      return json({ error: message }, upstream.status);
    }

    // Forward only output text deltas as a plain text stream.
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        let buf = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const parts = buf.split('\n');
            buf = parts.pop() ?? '';
            for (const line of parts) {
              if (!line.startsWith('data:')) continue;
              const data = line.slice(5).trim();
              if (!data || data === '[DONE]') continue;
              try {
                const ev = JSON.parse(data);
                if (ev.type === 'response.output_text.delta' && ev.delta) controller.enqueue(enc.encode(ev.delta));
                if (ev.type === 'error' || ev.type === 'response.failed') controller.enqueue(enc.encode('\n\n[Erreur du service IA]'));
              } catch { /* partial */ }
            }
          }
        } catch { /* aborted */ }
        controller.close();
      },
    });
    return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (e) {
    console.error(e);
    return json({ error: 'Erreur interne' }, 500);
  }
});
