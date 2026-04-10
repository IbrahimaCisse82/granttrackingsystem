import type { BudgetLine, Project, Report } from './types';

export function lineTotal(l: BudgetLine): number {
  return l.qty * l.montant * (l.allocation / 100);
}

export function calcBudgetTotal(proj: Project): number {
  return proj.budgetLines.reduce((s, l) => s + lineTotal(l), 0);
}

export function calcDepensesTotal(proj: Project): number {
  return proj.reports.reduce((s, r) => s + Object.values(r.depenses).reduce((a, b) => a + b, 0), 0);
}

export const EUR_TO_FCFA = 655.957;

export function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function fmtFCFA(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

export function createEmptyReport(): Report {
  return {
    status: 'vide', dateSubmit: '', periodeDebut: '', periodeFin: '',
    depenses: {}, previsions: {}, explanation: {}, transactions: [],
  };
}

export function getReportCount(periodicite: string): number {
  switch (periodicite) {
    case 'Mensuelle': return 12;
    case 'Trimestrielle': return 4;
    case 'Semestrielle': return 2;
    case 'Annuelle': return 1;
    default: return 4;
  }
}
