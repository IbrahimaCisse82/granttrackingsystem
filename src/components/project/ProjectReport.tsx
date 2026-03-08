import { Project, Report, lineTotal, fmt, calcDepensesTotal, createEmptyReport } from '@/lib/mock-data';
import { useState, useCallback } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

const STATUS_STYLES: Record<string, [string, string]> = {
  vide: ['bg-muted text-steel', 'Vide'],
  en_cours: ['bg-amber-light text-amber', 'En cours'],
  soumis: ['bg-teal-light text-teal', 'Soumis'],
  valide: ['bg-emerald-light text-emerald', 'Validé'],
};

interface Props {
  project: Project;
  reportIndex: number;
  onSave: (partial: Partial<Project>) => void;
  readOnly?: boolean;
}

export default function ProjectReport({ project, reportIndex, onSave, readOnly }: Props) {
  const [activeTab, setActiveTab] = useState<'engaged' | 'prevues' | 'reconcil'>('engaged');
  const report = project.reports?.[reportIndex];

  const updateReport = useCallback((patch: Partial<Report>) => {
    if (readOnly || !report) return;
    const newReports = [...project.reports];
    newReports[reportIndex] = { ...newReports[reportIndex], ...patch };
    onSave({ reports: newReports });
  }, [project.reports, reportIndex, onSave, report, readOnly]);

  const handleDateChange = useCallback((field: 'dateSubmit' | 'periodeDebut' | 'periodeFin', value: string) => {
    updateReport({ [field]: value });
  }, [updateReport]);

  const handleDepChange = useCallback((code: string, value: number) => {
    if (!report) return;
    updateReport({ depenses: { ...report.depenses, [code]: value } });
  }, [updateReport, report]);

  const handleExplChange = useCallback((code: string, value: string) => {
    if (!report) return;
    updateReport({ explanation: { ...report.explanation, [code]: value } });
  }, [updateReport, report]);

  const handlePrevChange = useCallback((code: string, period: string, value: number) => {
    if (!report) return;
    const previsions = { ...report.previsions };
    if (!previsions[code]) previsions[code] = {};
    previsions[code] = { ...previsions[code], [period]: value };
    updateReport({ previsions });
  }, [updateReport, report]);

  const handleStatusChange = useCallback((status: Report['status']) => {
    updateReport({ status });
  }, [updateReport]);

  if (!report) {
    const initReport = () => {
      if (readOnly) return;
      const newReports = [...(project.reports || [])];
      while (newReports.length <= reportIndex) newReports.push(createEmptyReport());
      onSave({ reports: newReports });
    };
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Rapport non disponible.</p>
        {!readOnly && (
          <button onClick={initReport} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90">
            Initialiser le rapport
          </button>
        )}
      </div>
    );
  }

  const n = reportIndex + 1;
  const padded = String(n).padStart(3, '0');
  const [badgeClass, badgeLabel] = STATUS_STYLES[report.status] || STATUS_STYLES.vide;
  const depByCode = report.depenses || {};
  const totalBudget = project.budgetLines.reduce((s, l) => s + lineTotal(l), 0);
  const totalDep = Object.values(depByCode).reduce((s, v) => s + v, 0);
  const soldeGrand = totalBudget - totalDep;

  const prevReportsDep = project.reports.slice(0, reportIndex).reduce((s, r) =>
    s + Object.values(r.depenses || {}).reduce((a, b) => a + b, 0), 0);
  const cumulDep = prevReportsDep + totalDep;

  const prevPeriods = ['P+1', 'P+2', 'P+3'];

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
        {!readOnly && (
          <div className="flex gap-2">
            <button onClick={() => handleStatusChange('en_cours')} className="rounded-md border border-rule bg-card px-3 py-1.5 text-xs font-medium text-steel hover:bg-paper">Marquer En cours</button>
            <button onClick={() => handleStatusChange('soumis')} className="rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110 transition-all">Soumettre le rapport</button>
          </div>
        )}
      </div>

      {/* Period info */}
      <div className="mb-4 overflow-hidden rounded-[10px] border border-rule bg-card p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[11.5px] font-medium text-steel mb-1">Date de soumission</label>
            <input type="date" defaultValue={report.dateSubmit} key={report.dateSubmit} disabled={readOnly} onChange={e => handleDateChange('dateSubmit', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-steel mb-1">Période — début</label>
            <input type="date" defaultValue={report.periodeDebut} key={report.periodeDebut} disabled={readOnly} onChange={e => handleDateChange('periodeDebut', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-steel mb-1">Période — fin</label>
            <input type="date" defaultValue={report.periodeFin} key={report.periodeFin} disabled={readOnly} onChange={e => handleDateChange('periodeFin', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed" />
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

      {/* Dépenses engagées */}
      {activeTab === 'engaged' && (
        <div className="overflow-hidden rounded-[10px] border border-rule bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-ink-2">
                  {['Code', 'Poste budgétaire', 'Budget total', 'Cumul antérieur', 'Dépenses période', 'Cumul total', 'Solde €', 'Solde %', 'Explication'].map(h => (
                    <th key={h} className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono last:border-r-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-enabel-light"><td colSpan={9} className="px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-enabel-dark">A — COÛTS OPÉRATIONNELS</td></tr>
                {project.budgetLines.filter(l => l.section === 'A').map((l, i) => {
                  const prevDep = project.reports.slice(0, reportIndex).reduce((s, r) => s + ((r.depenses || {})[l.code] || 0), 0);
                  return (
                    <DepRow key={i} line={l} dep={depByCode[l.code] || 0} prevDep={prevDep} badge={project.color.badge} expl={report.explanation?.[l.code] || ''}
                      onDepChange={v => handleDepChange(l.code, v)}
                      onExplChange={v => handleExplChange(l.code, v)}
                      readOnly={readOnly}
                    />
                  );
                })}
                <tr className="bg-amber-light"><td colSpan={9} className="px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-amber">B — FRAIS DE GESTION</td></tr>
                {project.budgetLines.filter(l => l.section === 'B').map((l, i) => {
                  const prevDep = project.reports.slice(0, reportIndex).reduce((s, r) => s + ((r.depenses || {})[l.code] || 0), 0);
                  return (
                    <DepRow key={i} line={l} dep={depByCode[l.code] || 0} prevDep={prevDep} badge="b-amber" expl={report.explanation?.[l.code] || ''}
                      onDepChange={v => handleDepChange(l.code, v)}
                      onExplChange={v => handleExplChange(l.code, v)}
                      readOnly={readOnly}
                    />
                  );
                })}
                <tr className="bg-ink text-sidebar-foreground font-mono font-bold text-xs">
                  <td colSpan={3} className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right">{fmt(prevReportsDep)} €</td>
                  <td className="px-3 py-2 text-right">{fmt(totalDep)} €</td>
                  <td className="px-3 py-2 text-right">{fmt(cumulDep)} €</td>
                  <td className="px-3 py-2 text-right">{fmt(soldeGrand)} €</td>
                  <td colSpan={2} className="px-3 py-2">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dépenses prévues */}
      {activeTab === 'prevues' && (
        <div className="overflow-hidden rounded-[10px] border border-rule bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-ink-2">
                  <th className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono">Code</th>
                  <th className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono">Poste budgétaire</th>
                  <th className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono">Solde disponible</th>
                  {prevPeriods.map(p => (
                    <th key={p} className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono last:border-r-0">Prév. {p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-enabel-light"><td colSpan={3 + prevPeriods.length} className="px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-enabel-dark">A — COÛTS OPÉRATIONNELS</td></tr>
                {project.budgetLines.filter(l => l.section === 'A').map((l, i) => {
                  const bud = lineTotal(l);
                  const cumDep = project.reports.slice(0, reportIndex + 1).reduce((s, r) => s + ((r.depenses || {})[l.code] || 0), 0);
                  const solde = bud - cumDep;
                  return (
                    <PrevRow key={i} line={l} solde={solde} badge={project.color.badge} periods={prevPeriods} previsions={report.previsions?.[l.code] || {}}
                      onPrevChange={(period, value) => handlePrevChange(l.code, period, value)} readOnly={readOnly} />
                  );
                })}
                <tr className="bg-amber-light"><td colSpan={3 + prevPeriods.length} className="px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-amber">B — FRAIS DE GESTION</td></tr>
                {project.budgetLines.filter(l => l.section === 'B').map((l, i) => {
                  const bud = lineTotal(l);
                  const cumDep = project.reports.slice(0, reportIndex + 1).reduce((s, r) => s + ((r.depenses || {})[l.code] || 0), 0);
                  const solde = bud - cumDep;
                  return (
                    <PrevRow key={i} line={l} solde={solde} badge="b-amber" periods={prevPeriods} previsions={report.previsions?.[l.code] || {}}
                      onPrevChange={(period, value) => handlePrevChange(l.code, period, value)} readOnly={readOnly} />
                  );
                })}
                <tr className="bg-ink text-sidebar-foreground font-mono font-bold text-xs">
                  <td colSpan={3} className="px-3 py-2">TOTAL PRÉVISIONS</td>
                  {prevPeriods.map(p => {
                    const total = project.budgetLines.reduce((s, l) => s + ((report.previsions?.[l.code] || {})[p] || 0), 0);
                    return <td key={p} className="px-3 py-2 text-right">{fmt(total)} €</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Réconciliation */}
      {activeTab === 'reconcil' && (
        <div>
          <div className="grid grid-cols-4 gap-3.5 mb-4">
            <div className="relative overflow-hidden rounded-[10px] border border-rule bg-card p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Budget total</p>
              <p className="mt-1.5 font-mono text-[22px] font-semibold">{fmt(totalBudget)} €</p>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
            </div>
            <div className="relative overflow-hidden rounded-[10px] border border-rule bg-card p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Dépenses cumulées</p>
              <p className="mt-1.5 font-mono text-[22px] font-semibold">{fmt(cumulDep)} €</p>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber" />
            </div>
            <div className="relative overflow-hidden rounded-[10px] border border-rule bg-card p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Solde disponible</p>
              <p className="mt-1.5 font-mono text-[22px] font-semibold">{fmt(totalBudget - cumulDep)} €</p>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald" />
            </div>
            <div className="relative overflow-hidden rounded-[10px] border border-rule bg-card p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Taux consommation</p>
              <p className="mt-1.5 font-mono text-[22px] font-semibold">{totalBudget > 0 ? Math.round(cumulDep / totalBudget * 100) : 0}%</p>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet" />
            </div>
          </div>

          <div className="overflow-hidden rounded-[10px] border border-rule bg-card mb-4">
            <div className="border-b border-rule px-4 py-3">
              <h3 className="text-[13px] font-semibold">Tableau de réconciliation</h3>
            </div>
            <div className="p-4">
              <table className="w-full text-[12.5px]">
                <tbody>
                  <ReconcilRow label="A. Budget total approuvé" value={totalBudget} />
                  <ReconcilRow label="B. Avance(s) reçue(s)" value={project.fiches.versements.reduce((s, v) => s + (v.montantRecu || 0), 0)} />
                  <ReconcilRow label="C. Intérêts bancaires" value={0} editable note="Si applicable" />
                  <ReconcilRow label="D. Autres revenus" value={0} editable />
                  <ReconcilRow label="E. Total fonds disponibles (B+C+D)" value={project.fiches.versements.reduce((s, v) => s + (v.montantRecu || 0), 0)} bold />
                  <ReconcilRow label="F. Dépenses éligibles cumulées" value={cumulDep} />
                  <ReconcilRow label="G. Solde en caisse/banque (E-F)" value={project.fiches.versements.reduce((s, v) => s + (v.montantRecu || 0), 0) - cumulDep} bold highlight />
                  <ReconcilRow label="H. Montant dû par le bailleur (A-E)" value={totalBudget - project.fiches.versements.reduce((s, v) => s + (v.montantRecu || 0), 0)} />
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[10px] border border-rule bg-card">
            <div className="border-b border-rule px-4 py-3">
              <h3 className="text-[13px] font-semibold">Progression par poste</h3>
            </div>
            <div className="p-4 space-y-3">
              {project.budgetLines.map((l, i) => {
                const bud = lineTotal(l);
                const cumDep = project.reports.reduce((s, r) => s + ((r.depenses || {})[l.code] || 0), 0);
                const pct = bud > 0 ? Math.min(100, Math.round(cumDep / bud * 100)) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 text-xs text-steel truncate">{l.code} — {l.desc}</span>
                    <div className="flex-1 h-[5px] rounded-full bg-rule overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: project.color.stripe }} />
                    </div>
                    <span className="w-20 text-right font-mono text-xs text-ink-3">{fmt(cumDep)} / {fmt(bud)}</span>
                    <span className="w-12 text-right font-mono text-xs text-ink-3">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
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

function DepRow({ line, dep, prevDep, badge, expl, onDepChange, onExplChange, readOnly }: {
  line: any; dep: number; prevDep: number; badge: string; expl: string;
  onDepChange: (v: number) => void;
  onExplChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const bud = lineTotal(line);
  const cumul = prevDep + dep;
  const solde = bud - cumul;
  const soldePct = bud > 0 ? (solde / bud * 100).toFixed(1) + '%' : '—';

  return (
    <tr className="hover:bg-paper/50 transition-colors">
      <td className="border-b border-rule-2 border-r px-3 py-2.5">
        <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${BADGE_COLORS[badge] || 'bg-enabel-light text-enabel-dark'}`}>{line.code}</span>
      </td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5">{line.desc}</td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono">{fmt(bud)}</td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono text-dim">{fmt(prevDep)}</td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5">
        <input type="number" defaultValue={dep} key={dep} disabled={readOnly} onChange={e => onDepChange(Number(e.target.value) || 0)}
          className="w-full text-right font-mono text-[12.5px] font-semibold rounded border border-input bg-background px-2 py-1 outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed" />
      </td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono font-semibold">{fmt(cumul)}</td>
      <td className={`border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono ${solde < 0 ? 'text-rose' : ''}`}>{fmt(solde)}</td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right text-muted-foreground">{soldePct}</td>
      <td className="border-b border-rule-2 px-3 py-2.5">
        <input type="text" defaultValue={expl} key={expl} disabled={readOnly} onChange={e => onExplChange(e.target.value)} placeholder="—"
          className="w-full text-[11px] italic text-muted-foreground rounded border border-transparent bg-transparent px-1 py-0.5 outline-none focus:border-input focus:bg-background disabled:opacity-60 disabled:cursor-not-allowed" />
      </td>
    </tr>
  );
}

function PrevRow({ line, solde, badge, periods, previsions, onPrevChange, readOnly }: {
  line: any; solde: number; badge: string; periods: string[]; previsions: Record<string, number>;
  onPrevChange: (period: string, value: number) => void;
  readOnly?: boolean;
}) {
  return (
    <tr className="hover:bg-paper/50 transition-colors">
      <td className="border-b border-rule-2 border-r px-3 py-2.5">
        <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${BADGE_COLORS[badge] || 'bg-enabel-light text-enabel-dark'}`}>{line.code}</span>
      </td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5">{line.desc}</td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono">{fmt(solde)}</td>
      {periods.map(p => (
        <td key={p} className="border-b border-rule-2 border-r px-3 py-2.5 last:border-r-0">
          <input type="number" defaultValue={previsions[p] || 0} key={`${line.code}-${p}-${previsions[p]}`}
            disabled={readOnly}
            onChange={e => onPrevChange(p, Number(e.target.value) || 0)}
            className="w-full text-right font-mono text-[12.5px] rounded border border-input bg-background px-2 py-1 outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed" />
        </td>
      ))}
    </tr>
  );
}

function ReconcilRow({ label, value, bold, highlight, editable, note }: {
  label: string; value: number; bold?: boolean; highlight?: boolean; editable?: boolean; note?: string;
}) {
  return (
    <tr className={`${highlight ? 'bg-enabel-light' : ''} border-b border-rule-2`}>
      <td className={`px-3 py-2.5 ${bold ? 'font-semibold' : ''}`}>
        {label}
        {note && <span className="ml-2 text-[10px] text-dim italic">{note}</span>}
      </td>
      <td className={`px-3 py-2.5 text-right font-mono w-40 ${bold ? 'font-bold' : ''} ${value < 0 ? 'text-rose' : ''}`}>
        {fmt(value)} €
      </td>
    </tr>
  );
}
