import { Project, calcBudgetTotal, calcDepensesTotal, fmt } from '@/lib/mock-data';
import { useAppStore } from '@/lib/store';

const RISK_STYLES: Record<string, string> = {
  'Faible risque': 'bg-emerald-light text-emerald',
  'Risque modéré': 'bg-teal-light text-teal',
  'Risque important': 'bg-amber-light text-amber',
  'Risque élevé': 'bg-rose-light text-rose',
};

export default function ProjectCard({ project }: { project: Project }) {
  const { openProject, deleteProject } = useAppStore();
  const budget = calcBudgetTotal(project);
  const depenses = calcDepensesTotal(project);
  const pct = budget > 0 ? Math.min(100, Math.round(depenses / budget * 100)) : 0;
  const rapSoumis = project.reports.filter(r => r.status !== 'vide').length;

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-[10px] border border-rule bg-card transition-all duration-200 hover:shadow-gts-md hover:-translate-y-0.5 hover:border-primary"
      onDoubleClick={() => openProject(project.id)}
    >
      {/* Color stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: project.color.stripe }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-rule p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-foreground leading-tight">{project.org}</p>
          <p className="mt-1 text-[11.5px] text-muted-foreground truncate">{project.title.slice(0, 60)}{project.title.length > 60 ? '…' : ''}</p>
        </div>
        <span className="shrink-0 rounded font-mono text-[10px] font-semibold px-2 py-0.5 bg-enabel-light text-enabel-dark">
          {project.convention}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-0">
        <Row label="Budget total" value={`${fmt(budget)} €`} />
        <Row label="Dépenses engagées" value={`${fmt(depenses)} €`} />
        <Row label="Pays" value={project.pays || '—'} noMono />
        <Row label="Période" value={`${project.debut || '—'} → ${project.fin || '—'}`} noMono small />
        <div className="flex items-center justify-between py-1.5 border-b border-rule-2 last:border-b-0">
          <span className="text-[11.5px] text-muted-foreground">Risque</span>
          <span className={`inline-block rounded px-2 py-0.5 font-mono text-[10.5px] font-semibold ${RISK_STYLES[project.risque] || 'bg-muted text-steel'}`}>
            {project.risque || '—'}
          </span>
        </div>
        <Row label="Rapports" value={`${rapSoumis} / 4 soumis`} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 border-t border-rule bg-paper p-3 px-4">
        <div className="flex-1">
          <div className="flex justify-between text-[10.5px] text-dim mb-1">
            <span>Consommation budget</span>
            <span>{pct}%</span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-full bg-rule">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: project.color.stripe }} />
          </div>
        </div>
        <div className="flex shrink-0 gap-1 ml-3">
          <button
            onClick={(e) => { e.stopPropagation(); openProject(project.id); }}
            className="rounded border border-rule bg-card px-2.5 py-1 text-[11px] font-medium text-steel transition-colors hover:bg-paper hover:border-dim"
          >
            Ouvrir
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
            className="rounded border border-rose-light bg-rose-light px-2 py-1 text-[11px] font-semibold text-rose transition-colors hover:bg-rose/10"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, noMono, small }: { label: string; value: string; noMono?: boolean; small?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-rule-2 last:border-b-0">
      <span className="text-[11.5px] text-muted-foreground">{label}</span>
      <span className={`${noMono ? '' : 'font-mono'} ${small ? 'text-[11px]' : 'text-xs'} font-medium text-ink-3`}>{value}</span>
    </div>
  );
}
