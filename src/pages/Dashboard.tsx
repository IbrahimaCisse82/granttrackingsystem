import { useState } from 'react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { fmt } from '@/lib/utils-project';
import MetricCard from '@/components/MetricCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Loader2, Filter, FileDown } from 'lucide-react';
import { exportDashboardPDF } from '@/lib/export-dashboard-pdf';
import { toast } from 'sonner';

const CHART_COLORS = ['hsl(204,100%,30%)', 'hsl(172,86%,32%)', 'hsl(28,91%,37%)', 'hsl(263,83%,42%)', 'hsl(343,86%,35%)', 'hsl(164,93%,20%)'];

export default function Dashboard() {
  const [paysFilter, setPaysFilter] = useState('');
  const [periodeFilter, setPeriodeFilter] = useState('');

  const { data: metrics, isLoading } = useDashboardMetrics({
    pays: paysFilter,
    periodicite: periodeFilter,
  });

  if (isLoading || !metrics) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const tauxConsommation = metrics.totalBudget > 0 ? Math.round(metrics.totalDepenses / metrics.totalBudget * 100) : 0;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Tableau de bord</h1>
          <p className="text-xs text-muted-foreground mt-1">Vue analytique consolidée de tous les projets</p>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              exportDashboardPDF(metrics, { pays: paysFilter, periodicite: periodeFilter });
              toast.success('Export PDF généré');
            } catch (e: any) {
              toast.error('Erreur export: ' + e.message);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-3 py-2 text-xs font-medium text-steel hover:bg-paper transition-colors"
          aria-label="Exporter le tableau de bord en PDF"
        >
          <FileDown className="w-3.5 h-3.5" />
          Exporter PDF
        </button>
      </div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 rounded-lg border border-rule bg-card p-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-medium text-steel">Pays :</label>
          <select value={paysFilter} onChange={e => setPaysFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary">
            <option value="">Tous</option>
            {metrics.countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-medium text-steel">Périodicité :</label>
          <select value={periodeFilter} onChange={e => setPeriodeFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary">
            <option value="">Toutes</option>
            {['Mensuelle', 'Trimestrielle', 'Semestrielle', 'Annuelle'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {(paysFilter || periodeFilter) && (
          <button onClick={() => { setPaysFilter(''); setPeriodeFilter(''); }} className="text-[11px] text-primary hover:underline ml-2">Réinitialiser</button>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">{metrics.totalProjects} projet(s)</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <MetricCard label="Projets actifs" value={String(metrics.totalProjects)} accentColor="blue" />
        <MetricCard label="Budget total" value={`${fmt(metrics.totalBudget)} €`} accentColor="teal" />
        <MetricCard label="Dépenses engagées" value={`${fmt(metrics.totalDepenses)} €`} note={`${tauxConsommation}% consommé`} accentColor="amber" />
        <MetricCard label="Rapports validés" value={String(metrics.totalRapports)} accentColor="emerald" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="rounded-[10px] border border-rule bg-card p-4">
          <h3 className="text-[13px] font-semibold mb-4">Budget vs Dépenses par projet</h3>
          {metrics.budgetByProject.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.budgetByProject} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `${fmt(v)} €`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="budget" fill="hsl(204,100%,30%)" name="Budget" radius={[3, 3, 0, 0]} />
                <Bar dataKey="depenses" fill="hsl(28,91%,37%)" name="Dépenses" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-12">Aucune donnée</p>
          )}
        </div>

        <div className="rounded-[10px] border border-rule bg-card p-4">
          <h3 className="text-[13px] font-semibold mb-4">Répartition budgétaire</h3>
          {metrics.sectionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={metrics.sectionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`} labelLine={{ strokeWidth: 1 }}>
                  {metrics.sectionData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${fmt(v)} €`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-12">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="rounded-[10px] border border-rule bg-card p-4">
          <h3 className="text-[13px] font-semibold mb-4">Répartition des financements par bailleur</h3>
          {metrics.bailleurData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={metrics.bailleurData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name.length > 18 ? name.slice(0, 18) + '…' : name} (${((percent ?? 0) * 100).toFixed(0)}%)`} labelLine={{ strokeWidth: 1 }}>
                  {metrics.bailleurData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${fmt(v)} €`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-12">Aucun bailleur enregistré</p>
          )}
        </div>

        <div className="rounded-[10px] border border-rule bg-card p-4">
          <h3 className="text-[13px] font-semibold mb-4">Évolution des dépenses</h3>
          {metrics.timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={metrics.timelineData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                <XAxis dataKey="periode" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `${fmt(v)} €`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="depenses" stroke="hsl(172,86%,32%)" strokeWidth={2} dot={{ r: 4 }} name="Dépenses" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-12">Aucune donnée de période</p>
          )}
        </div>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[10px] border border-rule bg-card p-4">
          <h3 className="text-[13px] font-semibold mb-4">Distribution des risques</h3>
          {metrics.riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={metrics.riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={{ strokeWidth: 1 }}>
                  {metrics.riskData.map((d, i) => {
                    const colorMap: Record<string, string> = {
                      'Faible risque': 'hsl(164,93%,20%)',
                      'Risque modéré': 'hsl(172,86%,32%)',
                      'Risque important': 'hsl(28,91%,37%)',
                      'Risque élevé': 'hsl(343,86%,35%)',
                    };
                    return <Cell key={i} fill={colorMap[d.name] || CHART_COLORS[i % CHART_COLORS.length]} />;
                  })}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-12">Aucune donnée</p>
          )}
        </div>
      </div>
    </div>
  );
}
