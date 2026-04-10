// Re-export from new locations for backward compatibility
export type { BudgetLine, Attachment, Transaction, Report, FicheVersement, Amendement, Project } from './types';
export { lineTotal, calcBudgetTotal, calcDepensesTotal, EUR_TO_FCFA, fmt, fmtFCFA, createEmptyReport, getReportCount } from './utils-project';

export const MOCK_PROJECTS: any[] = [];
