import { Project, Transaction, fmt } from '@/lib/mock-data';
import MetricCard from '@/components/MetricCard';
import { useCallback } from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  project: Project;
  reportIndex: number;
  onSave: (partial: Partial<Project>) => void;
}

export default function ProjectTransactions({ project, reportIndex, onSave }: Props) {
  const report = project.reports?.[reportIndex];
  const transactions = report?.transactions || [];

  const updateTransactions = useCallback((newTx: Transaction[]) => {
    if (!report) return;
    const newReports = [...project.reports];
    newReports[reportIndex] = { ...newReports[reportIndex], transactions: newTx };
    onSave({ reports: newReports });
  }, [project.reports, reportIndex, onSave, report]);

  const addTransaction = useCallback(() => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      code: '',
      date: new Date().toISOString().slice(0, 10),
      voucher: '',
      beneficiaire: '',
      montantDevise: 0,
      tauxChange: project.taux,
      montantEUR: 0,
      description: '',
    };
    updateTransactions([...transactions, newTx]);
  }, [transactions, updateTransactions, project.taux]);

  const updateTx = useCallback((index: number, patch: Partial<Transaction>) => {
    const newTx = transactions.map((t, i) => {
      if (i !== index) return t;
      const updated = { ...t, ...patch };
      // Auto-calculate montantEUR when montantDevise or tauxChange changes
      if (patch.montantDevise !== undefined || patch.tauxChange !== undefined) {
        const devise = patch.montantDevise !== undefined ? patch.montantDevise : t.montantDevise;
        const taux = patch.tauxChange !== undefined ? patch.tauxChange : t.tauxChange;
        updated.montantEUR = taux > 0 ? Math.round((devise / taux) * 100) / 100 : 0;
      }
      return updated;
    });
    updateTransactions(newTx);
  }, [transactions, updateTransactions]);

  const removeTx = useCallback((index: number) => {
    updateTransactions(transactions.filter((_, i) => i !== index));
  }, [transactions, updateTransactions]);

  if (!report) return <p className="p-8 text-muted-foreground">Rapport non disponible.</p>;

  const n = reportIndex + 1;
  const totalEUR = transactions.reduce((s, t) => s + (t.montantEUR || 0), 0);
  const totalDepenses = Object.values(report.depenses || {}).reduce((s, v) => s + v, 0);
  const variance = totalDepenses - totalEUR;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Liste des transactions — REP {String(n).padStart(2, '0')}</h1>
          <p className="text-xs text-muted-foreground mt-1">{project.org} · {transactions.length} transaction(s)</p>
        </div>
        <button onClick={addTransaction} className="rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110 transition-all">
          + Ajouter
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-6">
        <MetricCard label="Total transactions" value={String(transactions.length)} accentColor="emerald" />
        <MetricCard label="Total EUR" value={`${fmt(totalEUR)} €`} accentColor="blue" />
        <MetricCard label="Variance vs Rapport" value={`${fmt(variance)} €`} note={Math.abs(variance) < 0.01 ? 'OK — concordant' : 'Écart à corriger'} accentColor={Math.abs(variance) < 0.01 ? 'emerald' : 'rose'} />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-rule bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-ink-2">
                {['#', 'Code budget.', 'Date', 'N° Voucher', 'Bénéficiaire', 'Montant devise', 'Taux', 'Montant EUR', 'Description', ''].map(h => (
                  <th key={h} className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? transactions.map((t, i) => (
                <tr key={t.id} className="hover:bg-paper/50 transition-colors group">
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 font-mono text-[11px] text-dim">{i + 1}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <select value={t.code} onChange={e => updateTx(i, { code: e.target.value })}
                      className="font-mono text-[10.5px] font-semibold bg-enabel-light text-enabel-dark rounded px-1.5 py-0.5 outline-none border-none">
                      <option value="">—</option>
                      {project.budgetLines.map(bl => <option key={bl.code} value={bl.code}>{bl.code}</option>)}
                    </select>
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="date" defaultValue={t.date} key={t.date} onChange={e => updateTx(i, { date: e.target.value })}
                      className="w-full bg-transparent font-mono text-xs outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="text" defaultValue={t.voucher} key={t.voucher} onChange={e => updateTx(i, { voucher: e.target.value })}
                      className="w-full bg-transparent font-mono text-xs outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="text" defaultValue={t.beneficiaire} key={t.beneficiaire} onChange={e => updateTx(i, { beneficiaire: e.target.value })}
                      className="w-full bg-transparent outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="number" defaultValue={t.montantDevise} key={`d-${t.montantDevise}`} onChange={e => updateTx(i, { montantDevise: Number(e.target.value) || 0 })}
                      className="w-24 text-right font-mono bg-transparent outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="number" defaultValue={t.tauxChange} key={`t-${t.tauxChange}`} onChange={e => updateTx(i, { tauxChange: Number(e.target.value) || 0 })}
                      className="w-20 text-right font-mono bg-transparent outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono font-semibold text-primary">
                    {fmt(t.montantEUR)} €
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="text" defaultValue={t.description} key={t.description} onChange={e => updateTx(i, { description: e.target.value })}
                      className="w-full bg-transparent text-muted-foreground outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 px-3 py-2.5">
                    <button onClick={() => removeTx(i)} className="opacity-0 group-hover:opacity-100 text-dim hover:text-rose transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-dim italic">Aucune transaction. Cliquez sur "+ Ajouter".</td>
                </tr>
              )}
              <tr className="bg-ink text-sidebar-foreground font-mono font-bold text-xs">
                <td colSpan={7} className="px-3 py-2">TOTAL</td>
                <td className="px-3 py-2 text-right">{fmt(totalEUR)} €</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
