import { useProjects } from '@/hooks/useProjects';
import { calcBudgetTotal, calcDepensesTotal, fmt, lineTotal } from '@/lib/mock-data';
import MetricCard from '@/components/MetricCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

const CHART_COLORS = ['hsl(204,100%,30%)', 'hsl(172,86%,32%)', 'hsl(28,91%,37%)', 'hsl(263,83%,42%)', 'hsl(343,86%,35%)', 'hsl(164,93%,20%)'];

export default function Dashboard() {
  const { projects, isLoading } = useProjects();

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const totalBudget = projects.reduce((s, p) => s + calcBudgetTotal(p), 0);
  const totalDepenses = projects.reduce((s, p) => s + calcDepensesTotal(p), 0);
  const totalRapports = projects.reduce((s, p) => s + p.reports.filter(r => r.status === 'soumis' || r.status === 'valide').length, 0);
  const tauxConsommation = totalBudget > 0 ? Math.round(totalDepenses / totalBudget * 100) : 0;

  // Data for charts
  const budgetByProject = projects.map(p => ({
    name: p.org.length > 15 ? p.org.slice(0, 15) + '…' : p.org,
    budget: Math.round(calcBudgetTotal(p)),
    depenses: Math.round(calcDepensesTotal(p)),
  }));

  // Budget by section across all projects
  const sectionData = (() => {
    let totalA = 0, totalB = 0;
    projects.forEach(p => {
      p.budgetLines.forEach(l => {
        const t = lineTotal(l);
        if (l.section === 'A') totalA += t;
        else totalB += t;
      });
    });
    return [
      { name: 'Coûts opérationnels (A)', value: Math.round(totalA) },
      { name: 'Frais de gestion (B)', value: Math.round(totalB) },
    ].filter(d => d.value > 0);
  })();

  // Risk distribution
  const riskData = (() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      const r = p.risque || 'Non défini';
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Monthly spending timeline (simulated from reports)
  const timelineData = projects.flatMap(p =>
    p.reports.filter(r => r.periodeDebut).map(r => ({
      periode: r.periodeDebut,
      depenses: Object.values(r.depenses || {}).reduce((s, v) => s + v, 0),
    }))
  ).sort((a, b) => a.periode.localeCompare(b.periode));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Tableau de bord</h1>
        <p className="text-xs text-muted-foreground mt-1">Vue analytique consolidée de tous les projets</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        <MetricCard label="Projets actifs" value={String(projects.length)} accentColor="blue" />
        <MetricCard label="Budget total" value={`${fmt(totalBudget)} €`} accentColor="teal" />
        <MetricCard label="Dépenses engagées" value={`${fmt(totalDepenses)} €`} note={`${tauxConsommation}% consommé`} accentColor="amber" />
        <MetricCard label="Rapports validés" value={String(totalRapports)} accentColor="emerald" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Budget vs Dépenses */}
        <div className="rounded-[10px] border border-rule bg-card p-4">
          <h3 className="text-[13px] font-semibold mb-4">Budget vs Dépenses par projet</h3>
          {budgetByProject.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={budgetByProject} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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

        {/* Répartition par section */}
        <div className="rounded-[10px] border border-rule bg-card p-4">
          <h3 className="text-[13px] font-semibold mb-4">Répartition budgétaire</h3>
          {sectionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sectionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={{ strokeWidth: 1 }}>
                  {sectionData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
      <div className="grid grid-cols-2 gap-4">
        {/* Timeline */}
        <div className="rounded-[10px] border border-rule bg-card p-4">
          <h3 className="text-[13px] font-semibold mb-4">Évolution des dépenses</h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timelineData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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

        {/* Risk distribution */}
        <div className="rounded-[10px] border border-rule bg-card p-4">
          <h3 className="text-[13px] font-semibold mb-4">Distribution des risques</h3>
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={{ strokeWidth: 1 }}>
                  {riskData.map((d, i) => {
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
