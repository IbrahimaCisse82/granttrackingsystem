import { Project, BudgetLine, lineTotal, fmt, fmtFCFA, EUR_TO_FCFA } from '@/lib/mock-data';
import { useCallback } from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  project: Project;
  onSave: (partial: Partial<Project>) => void;
}

export default function ProjectBudget({ project, onSave }: Props) {
  const linesA = project.budgetLines.filter(l => l.section === 'A');
  const linesB = project.budgetLines.filter(l => l.section === 'B');
  const totalA = linesA.reduce((s, l) => s + lineTotal(l), 0);
  const totalB = linesB.reduce((s, l) => s + lineTotal(l), 0);
  const grand = totalA + totalB;

  const updateLine = useCallback((index: number, patch: Partial<BudgetLine>) => {
    const newLines = project.budgetLines.map((l, i) => i === index ? { ...l, ...patch } : l);
    onSave({ budgetLines: newLines });
  }, [project.budgetLines, onSave]);

  const addLine = useCallback((section: 'A' | 'B') => {
    const count = project.budgetLines.filter(l => l.section === section).length;
    const newLine: BudgetLine = {
      code: `${section}${count + 1}`,
      section,
      desc: '',
      unite: 'Forfait',
      qty: 1,
      montant: 0,
      allocation: 100,
    };
    onSave({ budgetLines: [...project.budgetLines, newLine] });
  }, [project.budgetLines, onSave]);

  const removeLine = useCallback((index: number) => {
    const newLines = project.budgetLines.filter((_, i) => i !== index);
    onSave({ budgetLines: newLines });
  }, [project.budgetLines, onSave]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Budget — Annexe 1b</h1>
          <p className="text-xs text-muted-foreground mt-1">{project.org} · Répartition des dépenses estimées</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">Taux de conversion : 1 € = {fmtFCFA(EUR_TO_FCFA)} FCFA</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => addLine('A')} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-[hsl(var(--enabel-dark))] transition-colors">
            + Coût opérationnel
          </button>
          <button onClick={() => addLine('B')} className="rounded-md border border-rule bg-card px-3 py-1.5 text-xs font-medium text-steel hover:bg-paper transition-colors">
            + Frais de gestion
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-rule bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-ink-2">
                {['Code', 'Poste budgétaire', 'Unité', 'Qté', 'Montant unit. (FCFA)', 'Alloc. %', 'Total FCFA', 'Total EUR', ''].map(h => (
                  <th key={h} className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono last:border-r-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SectionRow label="A — COÛTS OPÉRATIONNELS" />
              {linesA.map((l) => {
                const globalIdx = project.budgetLines.indexOf(l);
                return <BudgetRow key={globalIdx} line={l} badge={project.color.badge} onUpdate={patch => updateLine(globalIdx, patch)} onRemove={() => removeLine(globalIdx)} />;
              })}
              <tr className="bg-ink text-sidebar-foreground font-mono font-bold text-xs">
                <td colSpan={6} className="px-3 py-2 border-r border-sidebar-foreground/10">SOUS-TOTAL A</td>
                <td className="px-3 py-2 text-right border-r border-sidebar-foreground/10">{fmtFCFA(totalA * EUR_TO_FCFA)} F</td>
                <td className="px-3 py-2 text-right text-sidebar-foreground/60">{fmt(totalA)} €</td>
                <td></td>
              </tr>

              <SectionRow label="B — FRAIS DE GESTION" amber />
              {linesB.map((l) => {
                const globalIdx = project.budgetLines.indexOf(l);
                return <BudgetRow key={globalIdx} line={l} badge="b-amber" onUpdate={patch => updateLine(globalIdx, patch)} onRemove={() => removeLine(globalIdx)} />;
              })}
              <tr className="bg-ink text-sidebar-foreground font-mono font-bold text-xs">
                <td colSpan={6} className="px-3 py-2 border-r border-sidebar-foreground/10">SOUS-TOTAL B</td>
                <td className="px-3 py-2 text-right border-r border-sidebar-foreground/10">{fmtFCFA(totalB * EUR_TO_FCFA)} F</td>
                <td className="px-3 py-2 text-right text-sidebar-foreground/60">{fmt(totalB)} €</td>
                <td></td>
              </tr>

              <tr className="bg-ink text-sidebar-foreground font-mono font-bold text-sm">
                <td colSpan={6} className="px-3 py-3 border-r border-sidebar-foreground/10">TOTAL GÉNÉRAL</td>
                <td className="px-3 py-3 text-right border-r border-sidebar-foreground/10">{fmtFCFA(grand * EUR_TO_FCFA)} F</td>
                <td className="px-3 py-3 text-right text-sidebar-foreground/60">{fmt(grand)} €</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SectionRow({ label, amber }: { label: string; amber?: boolean }) {
  return (
    <tr className={amber ? 'bg-amber-light' : 'bg-enabel-light'}>
      <td colSpan={9} className={`px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider ${amber ? 'text-amber' : 'text-enabel-dark'}`}>
        {label}
      </td>
    </tr>
  );
}

const BADGE_COLORS: Record<string, string> = {
  'b-blue': 'bg-enabel-light text-enabel-dark',
  'b-teal': 'bg-teal-light text-teal',
  'b-amber': 'bg-amber-light text-amber',
  'b-violet': 'bg-violet-light text-violet',
};

function BudgetRow({ line, badge, onUpdate, onRemove }: { line: BudgetLine; badge: string; onUpdate: (patch: Partial<BudgetLine>) => void; onRemove: () => void }) {
  const totalEur = lineTotal(line);
  const totalFcfa = totalEur * EUR_TO_FCFA;
  const montantFcfa = line.montant * EUR_TO_FCFA;

  return (
    <tr className="hover:bg-paper/50 transition-colors group">
      <td className="border-b border-rule-2 border-r border-rule-2 px-3 py-2.5">
        <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${BADGE_COLORS[badge] || 'bg-enabel-light text-enabel-dark'}`}>
          {line.code}
        </span>
      </td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5">
        <input type="text" defaultValue={line.desc} key={line.desc} onChange={e => onUpdate({ desc: e.target.value })}
          className="w-full bg-transparent outline-none focus:bg-card focus:border-input rounded px-1" />
      </td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5">
        <input type="text" defaultValue={line.unite} key={line.unite} onChange={e => onUpdate({ unite: e.target.value })}
          className="w-20 bg-transparent text-muted-foreground outline-none focus:bg-card rounded px-1" />
      </td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5">
        <input type="number" defaultValue={line.qty} key={line.qty} onChange={e => onUpdate({ qty: Number(e.target.value) || 0 })}
          className="w-16 text-right font-mono bg-transparent outline-none focus:bg-card rounded px-1" />
      </td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5">
        <input type="number" defaultValue={montantFcfa} key={montantFcfa} onChange={e => onUpdate({ montant: (Number(e.target.value) || 0) / EUR_TO_FCFA })}
          className="w-28 text-right font-mono bg-transparent outline-none focus:bg-card rounded px-1" />
      </td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5">
        <input type="number" defaultValue={line.allocation} key={line.allocation} onChange={e => onUpdate({ allocation: Number(e.target.value) || 0 })}
          className="w-16 text-right font-mono bg-transparent outline-none focus:bg-card rounded px-1" />
      </td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono font-semibold">{fmtFCFA(totalFcfa)} F</td>
      <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono text-muted-foreground">{fmt(totalEur)} €</td>
      <td className="border-b border-rule-2 px-3 py-2.5">
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-dim hover:text-rose transition-all" title="Supprimer">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}
