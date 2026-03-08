import * as XLSX from 'xlsx';
import type { Project } from '@/lib/mock-data';
import { lineTotal, EUR_TO_FCFA } from '@/lib/mock-data';

export function exportBudgetExcel(project: Project) {
  const wb = XLSX.utils.book_new();

  // Budget sheet
  const budgetData = project.budgetLines.map(l => {
    const tot = lineTotal(l);
    return {
      'Section': l.section === 'A' ? 'Coûts opérationnels' : 'Frais de gestion',
      'Code': l.code,
      'Poste budgétaire': l.desc,
      'Unité': l.unite,
      'Quantité': l.qty,
      'Montant unitaire (FCFA)': Math.round(l.montant * EUR_TO_FCFA),
      'Allocation %': l.allocation,
      'Total FCFA': Math.round(tot * EUR_TO_FCFA),
      'Total EUR': Math.round(tot * 100) / 100,
    };
  });

  const ws = XLSX.utils.json_to_sheet(budgetData);
  ws['!cols'] = [{ wch: 20 }, { wch: 8 }, { wch: 30 }, { wch: 10 }, { wch: 8 }, { wch: 18 }, { wch: 10 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Budget Annexe 1b');

  XLSX.writeFile(wb, `${project.convention}-budget.xlsx`);
}

export function exportTransactionsExcel(project: Project, reportIndex: number) {
  const report = project.reports[reportIndex];
  if (!report) return;

  const wb = XLSX.utils.book_new();
  const n = String(reportIndex + 1).padStart(2, '0');

  const txData = report.transactions.map((t, i) => ({
    '#': i + 1,
    'Code budget': t.code,
    'Date': t.date,
    'N° Voucher': t.voucher,
    'Bénéficiaire': t.beneficiaire,
    [`Montant ${project.devise}`]: t.montantDevise,
    'Taux de change': t.tauxChange,
    'Montant EUR': t.montantEUR,
    'Description': t.description,
    'Pièces jointes': (t.attachments || []).map(a => a.name).join(', '),
  }));

  const ws = XLSX.utils.json_to_sheet(txData);
  ws['!cols'] = [{ wch: 5 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws, `Transactions REP ${n}`);

  XLSX.writeFile(wb, `${project.convention}-transactions-rep${n}.xlsx`);
}

export function exportFullProjectExcel(project: Project) {
  const wb = XLSX.utils.book_new();

  // Budget sheet
  const budgetData = project.budgetLines.map(l => {
    const tot = lineTotal(l);
    return {
      'Section': l.section === 'A' ? 'Coûts opérationnels' : 'Frais de gestion',
      'Code': l.code,
      'Poste': l.desc,
      'Qté': l.qty,
      'Montant FCFA': Math.round(l.montant * EUR_TO_FCFA),
      'Alloc. %': l.allocation,
      'Total EUR': Math.round(tot * 100) / 100,
    };
  });
  const wsBudget = XLSX.utils.json_to_sheet(budgetData);
  XLSX.utils.book_append_sheet(wb, wsBudget, 'Budget');

  // Transactions sheets
  project.reports.forEach((r, i) => {
    if (r.transactions.length === 0) return;
    const txData = r.transactions.map((t, j) => ({
      '#': j + 1,
      'Code': t.code,
      'Date': t.date,
      'Voucher': t.voucher,
      'Bénéficiaire': t.beneficiaire,
      'Montant devise': t.montantDevise,
      'Montant EUR': t.montantEUR,
      'Description': t.description,
    }));
    const ws = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, ws, `Trans REP ${String(i + 1).padStart(2, '0')}`);
  });

  XLSX.writeFile(wb, `${project.convention}-complet.xlsx`);
}
