import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Activity, AlertTriangle, Bug, Gauge, ShieldCheck, History } from 'lucide-react';

interface Bucket24h { hour: string; count: number }

export default function AdminHealth() {
  const { role } = useAuth();

  const errors = useQuery({
    queryKey: ['health-errors-24h'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from('client_errors')
        .select('created_at, severity')
        .gte('created_at', since)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: role === 'admin',
    refetchInterval: 60_000,
  });

  const rateLimits = useQuery({
    queryKey: ['health-ratelimits'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from('rate_limits')
        .select('action, identifier, count, window_start')
        .gte('window_start', since)
        .order('count', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: role === 'admin',
    refetchInterval: 60_000,
  });

  const audit = useQuery({
    queryKey: ['health-audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
    enabled: role === 'admin',
  });

  if (role !== 'admin') {
    return <div className="p-8 text-sm text-muted-foreground">Accès réservé aux administrateurs.</div>;
  }

  // Bucket errors per hour
  const buckets: Bucket24h[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600 * 1000);
    d.setMinutes(0, 0, 0);
    buckets.push({ hour: d.toISOString(), count: 0 });
  }
  for (const e of errors.data ?? []) {
    const d = new Date(e.created_at);
    d.setMinutes(0, 0, 0);
    const key = d.toISOString();
    const b = buckets.find(b => b.hour === key);
    if (b) b.count++;
  }
  const maxCount = Math.max(1, ...buckets.map(b => b.count));
  const totalErrors24h = errors.data?.length ?? 0;
  const fatalCount = (errors.data ?? []).filter(e => e.severity === 'fatal').length;
  const errorCount = (errors.data ?? []).filter(e => e.severity === 'error').length;

  const breaches = (rateLimits.data ?? []).filter((r: any) => r.count > 50).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Santé du système</h1>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble des erreurs, abus et activités sensibles — 24 dernières heures.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KpiCard icon={<Bug className="w-4 h-4" />} label="Erreurs (24h)" value={totalErrors24h} tone={totalErrors24h > 50 ? 'rose' : 'sky'} />
        <KpiCard icon={<AlertTriangle className="w-4 h-4" />} label="Erreurs fatales" value={fatalCount} tone={fatalCount > 0 ? 'rose' : 'emerald'} />
        <KpiCard icon={<Gauge className="w-4 h-4" />} label="Pics rate-limit" value={breaches} tone={breaches > 0 ? 'amber' : 'emerald'} />
        <KpiCard icon={<ShieldCheck className="w-4 h-4" />} label="Erreurs niveau « error »" value={errorCount} tone={errorCount > 10 ? 'amber' : 'sky'} />
      </div>

      {/* Sparkline 24h */}
      <section className="rounded-lg border border-rule bg-card p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Erreurs par heure
        </h2>
        <div className="flex items-end gap-1 h-32">
          {buckets.map((b, i) => {
            const h = Math.max(2, Math.round((b.count / maxCount) * 100));
            const date = new Date(b.hour);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${date.getHours()}h — ${b.count}`}>
                <div
                  className={`w-full rounded-t transition-colors ${b.count > 0 ? 'bg-primary/70 hover:bg-primary' : 'bg-muted'}`}
                  style={{ height: `${h}%` }}
                />
                {i % 4 === 0 && <span className="text-[9px] text-muted-foreground">{date.getHours()}h</span>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Rate-limits */}
      <section className="rounded-lg border border-rule bg-card p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Gauge className="w-4 h-4" /> Top compteurs de rate-limit (24h)
        </h2>
        {rateLimits.isLoading && <div className="text-xs text-muted-foreground">Chargement…</div>}
        {rateLimits.data?.length === 0 && <div className="text-xs text-muted-foreground">Aucun appel limité.</div>}
        <div className="space-y-1.5">
          {rateLimits.data?.slice(0, 10).map((r: any, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-rule last:border-0">
              <div className="flex-1 min-w-0">
                <div className="font-mono truncate">{r.action}</div>
                <div className="text-[10px] text-muted-foreground truncate">{r.identifier}</div>
              </div>
              <span className={`font-mono font-semibold px-2 py-0.5 rounded ${r.count > 50 ? 'bg-rose-50 text-rose-700' : 'bg-muted text-foreground/70'}`}>
                {r.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Audit */}
      <section className="rounded-lg border border-rule bg-card p-5">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <History className="w-4 h-4" /> Dernières activités sensibles
        </h2>
        {audit.isLoading && <div className="text-xs text-muted-foreground">Chargement…</div>}
        <div className="space-y-1.5">
          {audit.data?.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between text-xs py-1.5 border-b border-rule last:border-0">
              <span className="font-mono">{a.action}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function KpiCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'sky' | 'emerald' | 'amber' | 'rose' }) {
  const tones: Record<string, string> = {
    sky: 'text-sky-700 bg-sky-50',
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    rose: 'text-rose-700 bg-rose-50',
  };
  return (
    <div className="rounded-lg border border-rule bg-card p-4">
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${tones[tone]}`}>
        {icon} {label}
      </div>
      <div className="text-2xl font-bold mt-2 tabular-nums">{value}</div>
    </div>
  );
}
