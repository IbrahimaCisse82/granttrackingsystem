import { Project, FicheVersement, fmt } from '@/lib/mock-data';
import { useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  project: Project;
  onSave: (partial: Partial<Project>) => void;
}

export default function ProjectFiche({ project, onSave }: Props) {
  const versements = project.fiches.versements;

  const updateVersement = useCallback((index: number, patch: Partial<FicheVersement>) => {
    const newV = versements.map((v, i) => i === index ? { ...v, ...patch } : v);
    onSave({ fiches: { ...project.fiches, versements: newV } });
  }, [versements, project.fiches, onSave]);

  const addVersement = useCallback(() => {
    const newV: FicheVersement = {
      periode: '',
      dateSoumission: '',
      montantDeclare: 0,
      montantValide: 0,
      versement: '',
      datePaiement: '',
      montantRecu: 0,
    };
    onSave({ fiches: { ...project.fiches, versements: [...versements, newV] } });
  }, [versements, project.fiches, onSave]);

  const removeVersement = useCallback((index: number) => {
    onSave({ fiches: { ...project.fiches, versements: versements.filter((_, i) => i !== index) } });
  }, [versements, project.fiches, onSave]);

  const totalDeclare = versements.reduce((s, v) => s + (v.montantDeclare || 0), 0);
  const totalValide = versements.reduce((s, v) => s + (v.montantValide || 0), 0);
  const totalRecu = versements.reduce((s, v) => s + (v.montantRecu || 0), 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Fiche récapitulative des rapports financiers</h1>
          <p className="text-xs text-muted-foreground mt-1">Rapports financiers · {project.org}</p>
        </div>
        <button onClick={addVersement} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-[hsl(var(--enabel-dark))] transition-colors">
          <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
        </button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-rule bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-ink-2">
                {['Rapport', 'Période', 'Soumis le', 'Montant déclaré', 'Montant validé', 'Tranche', 'Date paiement', 'Montant reçu', ''].map(h => (
                  <th key={h} className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono last:border-r-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versements.map((v, i) => (
                <tr key={i} className="hover:bg-paper/50 transition-colors group">
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 font-semibold">Rapport N° {String(i + 1).padStart(3, '0')}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="text" defaultValue={v.periode} key={v.periode} onChange={e => updateVersement(i, { periode: e.target.value })}
                      className="w-full bg-transparent text-muted-foreground outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="date" defaultValue={v.dateSoumission} key={v.dateSoumission} onChange={e => updateVersement(i, { dateSoumission: e.target.value })}
                      className="w-full bg-transparent font-mono text-xs outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="number" defaultValue={v.montantDeclare} key={v.montantDeclare} onChange={e => updateVersement(i, { montantDeclare: Number(e.target.value) || 0 })}
                      className="w-full text-right font-mono bg-transparent outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="number" defaultValue={v.montantValide} key={v.montantValide} onChange={e => updateVersement(i, { montantValide: Number(e.target.value) || 0 })}
                      className="w-full text-right font-mono bg-transparent outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="text" defaultValue={v.versement} key={v.versement} onChange={e => updateVersement(i, { versement: e.target.value })}
                      className="w-full bg-transparent outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="date" defaultValue={v.datePaiement} key={v.datePaiement} onChange={e => updateVersement(i, { datePaiement: e.target.value })}
                      className="w-full bg-transparent font-mono text-xs outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="number" defaultValue={v.montantRecu} key={v.montantRecu} onChange={e => updateVersement(i, { montantRecu: Number(e.target.value) || 0 })}
                      className="w-full text-right font-mono font-semibold text-emerald bg-transparent outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 px-3 py-2.5">
                    <button onClick={() => removeVersement(i)} className="opacity-0 group-hover:opacity-100 text-dim hover:text-rose transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {versements.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-dim italic">Aucune fiche. Cliquez sur "+ Ajouter une ligne".</td></tr>
              )}
              {versements.length > 0 && (
                <tr className="bg-ink text-sidebar-foreground font-mono font-bold text-xs">
                  <td colSpan={3} className="px-3 py-2">TOTAUX</td>
                  <td className="px-3 py-2 text-right">{fmt(totalDeclare)} €</td>
                  <td className="px-3 py-2 text-right">{fmt(totalValide)} €</td>
                  <td colSpan={2}></td>
                  <td className="px-3 py-2 text-right">{fmt(totalRecu)} €</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
