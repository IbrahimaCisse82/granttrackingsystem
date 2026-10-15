import { useTranslation } from 'react-i18next';
import { useBudgetLines, useProjectTransactions } from '@/hooks/useProjectLedger';
import { lineTotal } from '@/lib/utils-project';
import type { Project } from '@/lib/types';

/** Compares project screen totals with the normalized reporting tables. */
export default function LedgerConsistency({ project }: { project: Project }) {
  const { t } = useTranslation();
  const { data: lines, isLoading: l1 } = useBudgetLines(project.id);
  const { data: txs, isLoading: l2 } = useProjectTransactions(project.id);
  if (l1 || l2 || !lines || !txs) return null;

  const screenBudget = project.budgetLines.reduce((s, l) => s + lineTotal(l), 0);
  const storedBudget = lines.reduce((s, l) => s + Number(l.qty) * Number(l.montant) * Number(l.allocation) / 100, 0);
  const screenTx = project.reports.reduce((s, r) => s + (r.transactions?.length ?? 0), 0);
  const ok = Math.abs(screenBudget - storedBudget) < 1 && screenTx === txs.length;

  return (
    <span
      title={t('ledger.detail', { a: Math.round(screenBudget), b: Math.round(storedBudget), c: screenTx, d: txs.length })}
      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${ok ? 'bg-secondary text-secondary-foreground' : 'bg-destructive/10 text-destructive'}`}
    >
      {ok ? t('ledger.ok') : t('ledger.mismatch')}
    </span>
  );
}
