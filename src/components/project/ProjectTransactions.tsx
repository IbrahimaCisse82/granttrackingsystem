import { Project, fmt } from '@/lib/mock-data';
import MetricCard from '@/components/MetricCard';

export default function ProjectTransactions({ project, reportIndex }: { project: Project; reportIndex: number }) {
  const report = project.reports[reportIndex];
  const transactions = report.transactions || [];
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
        <button className="rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110 transition-all">
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
                {['#', 'Code budget.', 'Date', 'N° Voucher', 'Bénéficiaire', 'Montant devise', 'Taux', 'Montant EUR', 'Description'].map(h => (
                  <th key={h} className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? transactions.map((t, i) => (
                <tr key={t.id} className="hover:bg-paper/50 transition-colors">
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 font-mono text-[11px] text-dim">{i + 1}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <span className="inline-block rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold bg-enabel-light text-enabel-dark">{t.code}</span>
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 font-mono text-xs">{t.date}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 font-mono text-xs">{t.voucher}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">{t.beneficiaire}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono">{fmt(t.montantDevise)}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono">{t.tauxChange}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono font-semibold text-primary">{fmt(t.montantEUR)} €</td>
                  <td className="border-b border-rule-2 px-3 py-2.5 text-muted-foreground">{t.description}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-dim italic">Aucune transaction. Cliquez sur "+ Ajouter".</td>
                </tr>
              )}
              <tr className="bg-ink text-sidebar-foreground font-mono font-bold text-xs">
                <td colSpan={7} className="px-3 py-2">TOTAL</td>
                <td className="px-3 py-2 text-right">{fmt(totalEUR)} €</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
