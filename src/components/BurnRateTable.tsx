import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBurnRate, type BurnRateProject } from '@/hooks/useBurnRate';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { fmt } from '@/lib/utils-project';
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, Loader2 } from 'lucide-react';


function StatusBadge({ status, variance }: { status: BurnRateProject['status']; variance: number }) {
  const { t } = useTranslation();
  const cfg = {
    on_track: { icon: CheckCircle2, label: t('burnRate.onTrackShort'), cls: 'text-emerald bg-emerald/10' },
    over: { icon: TrendingUp, label: t('burnRate.overPct', { v: variance }), cls: 'text-rose bg-rose/10' },
    under: { icon: TrendingDown, label: t('burnRate.underPct', { v: variance }), cls: 'text-amber bg-amber/10' },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function DualBar({ elapsed, burn }: { elapsed: number; burn: number }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1 min-w-[140px]">
      <div className="flex items-center gap-2">
        <span className="text-[9px] w-10 text-muted-foreground">{t('burnRate.time')}</span>
        <div className="flex-1 h-1.5 rounded bg-muted overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${Math.min(100, elapsed)}%` }} />
        </div>
        <span className="text-[10px] font-mono w-9 text-right">{elapsed}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] w-10 text-muted-foreground">{t('burnRate.budget')}</span>
        <div className="flex-1 h-1.5 rounded bg-muted overflow-hidden">
          <div className="h-full bg-teal" style={{ width: `${Math.min(100, burn)}%` }} />
        </div>
        <span className="text-[10px] font-mono w-9 text-right">{burn}%</span>
      </div>
    </div>
  );
}

export default function BurnRateTable() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useBurnRate();
  const { user } = useAuth();
  const lng = i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR';
  const projects = data?.projects ?? [];

  // Notify once per day per project when variance exceeds 20 points (critical)
  useEffect(() => {
    if (!user) return;
    const day = new Date().toISOString().slice(0, 10);
    const critical = projects.filter(p => Math.abs(p.variance) > 20);
    critical.forEach(async (p) => {
      const key = `burn-alert:${user.id}:${p.id}:${day}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'warning',
        title: t('burnRate.criticalTitle'),
        message: t('burnRate.criticalMessage', { title: p.title, v: p.variance }),
        project_id: p.id,
      });
    });
  }, [projects, user, t]);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="rounded-[10px] border border-rule bg-card p-4">

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold flex items-center gap-2">
          {t('burnRate.title')}
          {data && data.alertCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-rose/10 text-rose px-1.5 py-0.5 text-[10px]">
              <AlertTriangle className="w-3 h-3" /> {t('burnRate.alerts', { count: data.alertCount })}
            </span>
          )}
        </h3>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-8">
          {t('burnRate.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-rule text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-2 font-semibold">{t('burnRate.project')}</th>
                <th className="py-2 px-2 font-semibold">{t('burnRate.progress')}</th>
                <th className="py-2 px-2 font-semibold text-right">{t('burnRate.budget')}</th>
                <th className="py-2 px-2 font-semibold text-right">{t('burnRate.spent')}</th>
                <th className="py-2 px-2 font-semibold">{t('burnRate.plannedEnd')}</th>
                <th className="py-2 pl-2 font-semibold">{t('burnRate.status')}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className={`border-b border-rule/50 hover:bg-paper ${Math.abs(p.variance) > 20 ? 'bg-rose/5' : ''}`}>
                  <td className="py-2 pr-2">
                    <div className="font-medium text-foreground truncate max-w-[180px] flex items-center gap-1" title={p.title}>
                      {Math.abs(p.variance) > 20 && <AlertTriangle className="w-3 h-3 shrink-0 text-rose" aria-label={t('burnRate.criticalTitle')} />}
                      <span className="truncate">{p.title}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{p.org}</div>
                  </td>

                  <td className="py-2 px-2"><DualBar elapsed={p.elapsed_pct} burn={p.burn_pct} /></td>
                  <td className="py-2 px-2 text-right font-mono">{fmt(p.budget_total)}</td>
                  <td className="py-2 px-2 text-right font-mono">{fmt(p.depenses_total)}</td>
                  <td className="py-2 px-2 text-[11px]">
                    {p.forecast_end ? new Date(p.forecast_end).toLocaleDateString(lng) : '—'}
                    <div className="text-[10px] text-muted-foreground">{t('burnRate.contractual')} : {new Date(p.fin).toLocaleDateString(lng)}</div>
                  </td>
                  <td className="py-2 pl-2"><StatusBadge status={p.status} variance={p.variance} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
