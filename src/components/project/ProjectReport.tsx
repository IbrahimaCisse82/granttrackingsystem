import { Project, lineTotal, fmt } from '@/lib/mock-data';
import { useState } from 'react';

const STATUS_STYLES: Record<string, [string, string]> = {
  vide: ['bg-muted text-steel', 'Vide'],
  en_cours: ['bg-amber-light text-amber', 'En cours'],
  soumis: ['bg-teal-light text-teal', 'Soumis'],
  valide: ['bg-emerald-light text-emerald', 'Validé'],
};

export default function ProjectReport({ project, reportIndex }: { project: Project; reportIndex: number }) {
  const [activeTab, setActiveTab] = useState<'engaged' | 'prevues' | 'reconcil'>('engaged');
  const report = project.reports[reportIndex];
  const n = reportIndex + 1;
  const padded = String(n).padStart(3, '0');
  const [badgeClass, badgeLabel] = STATUS_STYLES[report.status] || STATUS_STYLES.vide;

  const depByCode = report.depenses || {};
  const totalBudget = project.budgetLines.reduce((s, l) => s + lineTotal(l), 0);
  const totalDep = Object.values(depByCode).reduce((s, v) => s + v, 0);
  const soldeGrand = totalBudget - totalDep;

  const tabs = [
    { id: 'engaged' as const, label: 'Dépenses engagées' },
    { id: 'prevues' as const, label: 'Dépenses prévues' },
    { id: 'reconcil' as const, label: 'Réconciliation' },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight">Rapport Financier N° {padded}</h1>
            <span className={`rounded px-2 py-0.5 font-mono text-[10.5px] font-semibold ${badgeClass}`}>{badgeLabel}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{project.org} · Dépenses engagées, prévues et réconciliation</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-rule bg-card px-3 py-1.5 text-xs font-medium text-steel hover:bg-paper">Marquer En cours</button>
          <button className="rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110 transition-all">Soumettre le rapport</button>
        </div>
      </div>

      {/* Period info */}
      <div className="mb-4 overflow-hidden rounded-[10px] border border-rule bg-card p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[11.5px] font-medium text-steel mb-1">Date de soumission</label>
            <input type="date" defaultValue={report.dateSubmit} className="w-full rounded-md border border-[#CBD5E0] bg-card px-3 py-2 text-xs font-mono outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-steel mb-1">Période — début</label>
            <input type="date" defaultValue={report.periodeDebut} className="w-full rounded-md border border-[#CBD5E0] bg-card px-3 py-2 text-xs font-mono outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-steel mb-1">Période — fin</label>
            <input type="date" defaultValue={report.periodeFin} className="w-full rounded-md border border-[#CBD5E0] bg-card px-3 py-2 text-xs font-mono outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b-2 border-rule mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`-mb-[2px] border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'engaged' && (
        <div className="overflow-hidden rounded-[10px] border border-rule bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-ink-2">
                  {['Code', 'Poste budgétaire', 'Budget total', 'Dépenses période', 'Solde €', 'Solde %', 'Explication'].map(h => (
                    <th key={h} className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono last:border-r-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-enabel-light"><td colSpan={7} className="px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-enabel-dark">A — COÛTS OPÉRATIONNELS</td></tr>
                {project.budgetLines.filter(l => l.section === 'A').map((l, i) => <DepRow key={i} line={l} dep={depByCode[l.code] || 0} badge={project.color.badge} expl={report.explanation?.[l.code] || ''} />)}
                <tr className="bg-amber-light"><td colSpan={7} className="px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-amber">B — FRAIS DE GESTION</td></tr>
                {project.budgetLines.filter(l => l.section === 'B').map((l, i) => <DepRow key={i} line={l} dep={depByCode[l.code] || 0} badge="b-amber" expl={report.explanation?.[l.code] || ''} />)}
                <tr className="bg-ink text-sidebar-foreground font-mono font-bold text-xs">
                  <td colSpan={3} className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right">{fmt(totalDep)} €</td>
                  <td className="px-3 py-2 text-right">{fmt(soldeGrand)} €</td>
                  <td colSpan={2} className="px-3 py-2">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reconcil' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="relative overflow-hidden rounded-[10px] border border-rule bg-card p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Budget total</p>
              <p className="mt-1.5 font-mono text-[22px] font-semibold">{fmt(totalBudget)} €</p>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
            </div>
            <div className="relative overflow-hidden rounded-[10px] border border-rule bg-card p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Dépenses engagées</p>
              <p className="mt-1.5 font-mono text-[22px] font-semibold">{fmt(totalDep)} €</p>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber" />
            </div>
            <div className="relative overflow-hidden rounded-[10px] border border-rule bg-card p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Solde disponible</p>
              <p className="mt-1.5 font-mono text-[22px] font-semibold">{fmt(soldeGrand)} €</p>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald" />
            </div>
          </div>
          <div className="rounded-[10px] border border-rule bg-card">
            <div className="border-b border-rule px-4 py-3">
              <h3 className="text-[13px] font-semibold">Progression par poste</h3>
            </div>
            <div className="p-4 space-y-3">
              {project.budgetLines.map((l, i) => {
                const bud = lineTotal(l);
                const dep = depByCode[l.code] || 0;
                const pct = bud > 0 ? Math.min(100, Math.round(dep / bud * 100)) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 text-xs text-steel truncate">{l.code} — {l.desc}</span>
                    <div className="flex-1 h-[5px] rounded-full bg-rule overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: project.color.stripe }} />
                    </div>
                    <span className="w-12 text-right font-mono text-xs text-ink-3">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prevues' && (
        <div className="rounded-[10px] border border-rule bg-card p-8 text-center text-sm text-muted-foreground italic">
          Section des dépenses prévues — à compléter pour les périodes suivantes.
        </div>
      )}
    </div>
  );
}

const BADGE_COLORS: Record<string, string> = {
  'b-blue': 'bg-enabel-light text-enabel-dark',
  'b-teal': 'bg-teal-light text-teal',
  'b-amber': 'bg-amber-light text-amber',
  'b-violet': 'bg-violet-light text-violet',
};

function DepRow({ line, dep, badge, expl }: { line: any; dep: number; badge: string; expl: string }) {
  const bud = lineTotal(line);
  const solde = bud - dep;
  const soldePct = bud > 0 ? (solde / bud * 100).toFixed(1) + '%' : '—';

  return (
    <tr className="hover:bg-paper/50 transition-colors">
      <td className="border-b border-rule-2 border-r px-3 py-2.5">
        <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${BADGE_COLORS[badge] || 'bg-enabel-light text-enabel-dark'}`}>{line.code}</span>
      </td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5">{line.desc}</td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono">{fmt(bud)}</td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono font-semibold">{fmt(dep)}</td>
      <td className={`border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono ${solde < 0 ? 'text-rose' : ''}`}>{fmt(solde)}</td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right text-muted-foreground">{soldePct}</td>
      <td className="border-b border-rule-2 px-3 py-2.5 text-muted-foreground italic text-[11px]">{expl || '—'}</td>
    </tr>
  );
}
