import { Project, Amendement, BudgetLine, fmt } from '@/lib/mock-data';
import { useCallback, useState } from 'react';
import { Plus, FileText, Check, X, Send, Lock } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';

interface Props {
  project: Project;
  onSave: (partial: Partial<Project>) => void;
  readOnly?: boolean;
}

const STATUS_STYLES: Record<string, [string, string]> = {
  brouillon: ['bg-muted text-steel', 'Brouillon'],
  soumis: ['bg-amber-light text-amber', 'Soumis'],
  approuve: ['bg-emerald-light text-emerald', 'Approuvé'],
  rejete: ['bg-rose-light text-rose', 'Rejeté'],
};

export default function ProjectAmendements({ project, onSave, readOnly }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ idx: number; action: string } | null>(null);
  const amendements = project.amendements || [];
  const { addNotification } = useNotifications();
  const amendements = project.amendements || [];

  const addAmendement = useCallback(() => {
    if (readOnly) return;
    const num = amendements.length + 1;
    const newAm: Amendement = {
      num,
      date: new Date().toISOString().slice(0, 10),
      motif: '',
      justification: '',
      statut: 'brouillon',
      lines: [],
    };
    onSave({ amendements: [...amendements, newAm] });
    setSelectedIdx(amendements.length);
  }, [amendements, onSave, readOnly]);

  const updateAmendement = useCallback((idx: number, patch: Partial<Amendement>) => {
    if (readOnly) return;
    const newAm = amendements.map((a, i) => i === idx ? { ...a, ...patch } : a);
    onSave({ amendements: newAm });
  }, [amendements, onSave, readOnly]);

  const addLine = useCallback((idx: number) => {
    if (readOnly) return;
    const am = amendements[idx];
    if (!am) return;
    const newLines = [...am.lines, { code: '', delta: 0 }];
    updateAmendement(idx, { lines: newLines });
  }, [amendements, updateAmendement, readOnly]);

  const updateLine = useCallback((amIdx: number, lineIdx: number, patch: { code?: string; delta?: number }) => {
    if (readOnly) return;
    const am = amendements[amIdx];
    if (!am) return;
    const newLines = am.lines.map((l, i) => i === lineIdx ? { ...l, ...patch } : l);
    updateAmendement(amIdx, { lines: newLines });
  }, [amendements, updateAmendement, readOnly]);

  const removeLine = useCallback((amIdx: number, lineIdx: number) => {
    if (readOnly) return;
    const am = amendements[amIdx];
    if (!am) return;
    const newLines = am.lines.filter((_, i) => i !== lineIdx);
    updateAmendement(amIdx, { lines: newLines });
  }, [amendements, updateAmendement, readOnly]);

  const handleStatusChange = (idx: number, statut: Amendement['statut']) => {
    if (readOnly) return;
    
    // If approving, apply delta lines to budget
    if (statut === 'approuve') {
      const am = amendements[idx];
      if (am && am.lines.length > 0) {
        const newBudgetLines = [...project.budgetLines];
        for (const line of am.lines) {
          const budgetIdx = newBudgetLines.findIndex(bl => bl.code === line.code);
          if (budgetIdx >= 0) {
            // Apply delta to the budget line montant
            newBudgetLines[budgetIdx] = {
              ...newBudgetLines[budgetIdx],
              montant: newBudgetLines[budgetIdx].montant + line.delta,
            };
          }
        }
        // Save both amended budget and status change
        const newAm = amendements.map((a, i) => i === idx ? { ...a, statut } : a);
        onSave({ amendements: newAm, budgetLines: newBudgetLines });
        toast.success('Amendement approuvé et appliqué au budget');
        setConfirmAction(null);
        return;
      }
    }
    
    updateAmendement(idx, { statut });
    setConfirmAction(null);
  };

  const selected = selectedIdx !== null ? amendements[selectedIdx] : null;
  const isSelectedLocked = selected && (selected.statut === 'approuve' || selected.statut === 'rejete');

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Amendements budgétaires</h1>
          <p className="text-xs text-muted-foreground mt-1">{project.org} · Gestion des addenda au budget initial</p>
        </div>
        {!readOnly && (
          <button onClick={addAmendement} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-[hsl(var(--enabel-dark))] transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nouvel amendement
          </button>
        )}
      </div>

      {amendements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-rule py-16 text-center">
          <FileText className="w-10 h-10 text-dim mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Aucun amendement</p>
          <p className="text-xs text-muted-foreground">Créez un amendement pour modifier le budget initial</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* List */}
          <div className="col-span-1 space-y-2">
            {amendements.map((am, i) => {
              const [badgeClass, badgeLabel] = STATUS_STYLES[am.statut] || STATUS_STYLES.brouillon;
              const totalDelta = am.lines.reduce((s, l) => s + l.delta, 0);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full text-left rounded-[10px] border p-3 transition-all ${selectedIdx === i ? 'border-primary bg-enabel-light' : 'border-rule bg-card hover:border-dim'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">Addenda N° {am.num}</span>
                    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${badgeClass}`}>{badgeLabel}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{am.motif || 'Sans motif'}</p>
                  <p className="text-[11px] font-mono mt-1">
                    <span className={totalDelta >= 0 ? 'text-emerald' : 'text-rose'}>{totalDelta >= 0 ? '+' : ''}{fmt(totalDelta)} €</span>
                    <span className="text-dim ml-2">{am.lines.length} ligne(s)</span>
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className="col-span-2">
            {selected ? (
              <div className="rounded-[10px] border border-rule bg-card">
                <div className="border-b border-rule px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold">Addenda N° {selected.num}</h3>
                    {isSelectedLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                  {!readOnly && !isSelectedLocked && (
                    <div className="flex gap-2">
                      {selected.statut === 'brouillon' && (
                        <button onClick={() => setConfirmAction({ idx: selectedIdx!, action: 'soumis' })}
                          className="inline-flex items-center gap-1 rounded-md bg-amber px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                          <Send className="w-3 h-3" /> Soumettre
                        </button>
                      )}
                      {selected.statut === 'soumis' && (
                        <>
                          <button onClick={() => setConfirmAction({ idx: selectedIdx!, action: 'approuve' })}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                            <Check className="w-3 h-3" /> Approuver
                          </button>
                          <button onClick={() => setConfirmAction({ idx: selectedIdx!, action: 'rejete' })}
                            className="inline-flex items-center gap-1 rounded-md bg-rose px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                            <X className="w-3 h-3" /> Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-steel mb-1">Date</label>
                      <input type="date" defaultValue={selected.date} key={`${selectedIdx}-date-${selected.date}`}
                        disabled={readOnly || !!isSelectedLocked}
                        onChange={e => updateAmendement(selectedIdx!, { date: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-steel mb-1">Motif</label>
                      <input type="text" defaultValue={selected.motif} key={`${selectedIdx}-motif-${selected.motif}`}
                        disabled={readOnly || !!isSelectedLocked}
                        onChange={e => updateAmendement(selectedIdx!, { motif: e.target.value })}
                        placeholder="Ex: Réallocation budgétaire"
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-steel mb-1">Justification</label>
                    <textarea defaultValue={selected.justification} key={`${selectedIdx}-just-${selected.justification}`}
                      disabled={readOnly || !!isSelectedLocked}
                      onChange={e => updateAmendement(selectedIdx!, { justification: e.target.value })}
                      placeholder="Justification détaillée de l'amendement…"
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:border-primary resize-none disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>

                  {/* Lines */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-medium text-steel">Lignes de modification</label>
                      {!readOnly && !isSelectedLocked && (
                        <button onClick={() => addLine(selectedIdx!)}
                          className="text-[11px] font-medium text-primary hover:underline">+ Ajouter une ligne</button>
                      )}
                    </div>
                    <div className="overflow-hidden rounded-lg border border-rule">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase text-muted-foreground">Code budg.</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase text-muted-foreground">Poste (réf.)</th>
                            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase text-muted-foreground">Delta (€)</th>
                            {!readOnly && !isSelectedLocked && <th className="px-3 py-2 w-8"></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {selected.lines.length === 0 ? (
                            <tr><td colSpan={4} className="px-3 py-6 text-center text-dim italic text-[11px]">Aucune ligne. Ajoutez une modification.</td></tr>
                          ) : selected.lines.map((line, li) => {
                            const budgetLine = project.budgetLines.find(b => b.code === line.code);
                            return (
                              <tr key={li} className="border-t border-rule hover:bg-muted/30">
                                <td className="px-3 py-2">
                                  <select value={line.code} disabled={readOnly || !!isSelectedLocked}
                                    onChange={e => updateLine(selectedIdx!, li, { code: e.target.value })}
                                    className="rounded border border-input bg-background px-2 py-1 text-xs font-mono outline-none disabled:opacity-60">
                                    <option value="">—</option>
                                    {project.budgetLines.map(bl => (
                                      <option key={bl.code} value={bl.code}>{bl.code}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2 text-muted-foreground text-[11px]">{budgetLine?.desc || '—'}</td>
                                <td className="px-3 py-2">
                                  <input type="number" defaultValue={line.delta} key={`${selectedIdx}-${li}-${line.delta}`}
                                    disabled={readOnly || !!isSelectedLocked}
                                    onChange={e => updateLine(selectedIdx!, li, { delta: Number(e.target.value) || 0 })}
                                    className="w-24 text-right font-mono text-xs rounded border border-input bg-background px-2 py-1 outline-none focus:border-primary disabled:opacity-60" />
                                </td>
                                {!readOnly && !isSelectedLocked && (
                                  <td className="px-3 py-2">
                                    <button onClick={() => removeLine(selectedIdx!, li)} className="text-dim hover:text-rose transition-colors">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                        {selected.lines.length > 0 && (
                          <tfoot>
                            <tr className="bg-ink text-sidebar-foreground font-mono font-bold text-xs">
                              <td colSpan={2} className="px-3 py-2">TOTAL DELTA</td>
                              <td className="px-3 py-2 text-right">{(() => { const t = selected.lines.reduce((s, l) => s + l.delta, 0); return `${t >= 0 ? '+' : ''}${fmt(t)} €`; })()}</td>
                              {!readOnly && !isSelectedLocked && <td></td>}
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-[10px] border-2 border-dashed border-rule py-16 text-center text-sm text-muted-foreground italic">
                Sélectionnez un amendement pour voir les détails
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'soumis' && 'Soumettre cet amendement ?'}
              {confirmAction?.action === 'approuve' && 'Approuver cet amendement ?'}
              {confirmAction?.action === 'rejete' && 'Rejeter cet amendement ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'soumis' && 'L\'amendement sera envoyé pour validation. Vous ne pourrez plus le modifier.'}
              {confirmAction?.action === 'approuve' && 'L\'amendement sera appliqué au budget. Les montants des lignes budgétaires seront ajustés automatiquement. Cette action est définitive.'}
              {confirmAction?.action === 'rejete' && 'L\'amendement sera marqué comme rejeté.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmAction && handleStatusChange(confirmAction.idx, confirmAction.action as Amendement['statut'])}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
