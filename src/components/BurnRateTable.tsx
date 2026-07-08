import { useBurnRate, type BurnRateProject } from '@/hooks/useBurnRate';
import { fmt } from '@/lib/utils-project';
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, Loader2 } from 'lucide-react';

function StatusBadge({ status, variance }: { status: BurnRateProject['status']; variance: number }) {
  const cfg = {
    on_track: { icon: CheckCircle2, label: 'Dans les temps', cls: 'text-emerald bg-emerald/10' },
    over: { icon: TrendingUp, label: `Sur-consommation (+${variance}%)`, cls: 'text-rose bg-rose/10' },
    under: { icon: TrendingDown, label: `Sous-consommation (${variance}%)`, cls: 'text-amber bg-amber/10' },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function DualBar({ elapsed, burn }: { elapsed: number; burn: number }) {
  return (
    <div className="space-y-1 min-w-[140px]">
      <div className="flex items-center gap-2">
        <span className="text-[9px] w-10 text-muted-foreground">Temps</span>
        <div className="flex-1 h-1.5 rounded bg-muted overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${Math.min(100, elapsed)}%` }} />
        </div>
        <span className="text-[10px] font-mono w-9 text-right">{elapsed}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] w-10 text-muted-foreground">Budget</span>
        <div className="flex-1 h-1.5 rounded bg-muted overflow-hidden">
          <div className="h-full bg-teal" style={{ width: `${Math.min(100, burn)}%` }} />
        </div>
        <span className="text-[10px] font-mono w-9 text-right">{burn}%</span>
      </div>
    </div>
  );
}

export default function BurnRateTable() {
  const { data, isLoading } = useBurnRate();
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  const projects = data?.projects ?? [];

  return (
    <div className="rounded-[10px] border border-rule bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold flex items-center gap-2">
          Burn rate & prévisions
          {data && data.alertCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-rose/10 text-rose px-1.5 py-0.5 text-[10px]">
              <AlertTriangle className="w-3 h-3" /> {data.alertCount} alerte(s)
            </span>
          )}
        </h3>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-8">
          Aucun projet avec dates début/fin renseignées
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-rule text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-2 font-semibold">Projet</th>
                <th className="py-2 px-2 font-semibold">Progression</th>
                <th className="py-2 px-2 font-semibold text-right">Budget</th>
                <th className="py-2 px-2 font-semibold text-right">Dépensé</th>
                <th className="py-2 px-2 font-semibold">Fin prévue</th>
                <th className="py-2 pl-2 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-rule/50 hover:bg-paper">
                  <td className="py-2 pr-2">
                    <div className="font-medium text-foreground truncate max-w-[180px]" title={p.title}>{p.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{p.org}</div>
                  </td>
                  <td className="py-2 px-2"><DualBar elapsed={p.elapsed_pct} burn={p.burn_pct} /></td>
                  <td className="py-2 px-2 text-right font-mono">{fmt(p.budget_total)}</td>
                  <td className="py-2 px-2 text-right font-mono">{fmt(p.depenses_total)}</td>
                  <td className="py-2 px-2 text-[11px]">
                    {p.forecast_end ? new Date(p.forecast_end).toLocaleDateString('fr-FR') : '—'}
                    <div className="text-[10px] text-muted-foreground">contractuelle : {new Date(p.fin).toLocaleDateString('fr-FR')}</div>
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
