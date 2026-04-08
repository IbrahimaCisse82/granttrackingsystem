export interface BudgetLine {
  code: string;
  section: 'A' | 'B';
  desc: string;
  unite: string;
  qty: number;
  montant: number;
  allocation: number;
}

export interface Attachment {
  name: string;
  url: string;
  path: string;
  size: number;
  uploadedAt: string;
}

export interface Transaction {
  id: string;
  code: string;
  date: string;
  voucher: string;
  beneficiaire: string;
  montantDevise: number;
  tauxChange: number;
  montantEUR: number;
  description: string;
  attachments?: Attachment[];
}

export interface Report {
  status: 'vide' | 'en_cours' | 'soumis' | 'valide';
  dateSubmit: string;
  periodeDebut: string;
  periodeFin: string;
  depenses: Record<string, number>;
  previsions: Record<string, Record<string, number>>;
  explanation: Record<string, string>;
  transactions: Transaction[];
}

export interface FicheVersement {
  periode: string;
  dateSoumission: string;
  montantDeclare: number;
  montantValide: number;
  versement: string;
  datePaiement: string;
  montantRecu: number;
}

export interface Amendement {
  num: number;
  date: string;
  motif: string;
  justification: string;
  statut: 'brouillon' | 'soumis' | 'approuve' | 'rejete';
  lines: { code: string; delta: number }[];
}

export interface Project {
  id: string;
  convention: string;
  org: string;
  orgType: string;
  title: string;
  pays: string;
  devise: string;
  taux: number;
  risque: string;
  debut: string;
  fin: string;
  periodicite: string;
  color: { stripe: string; badge: string };
  budgetLines: BudgetLine[];
  reports: Report[];
  fiches: { versements: FicheVersement[] };
  amendements: Amendement[];
  infos: { submitDate: string; preparedBy: string; version: string; scoreRisque: string };
  indicators?: any[];
  createdAt: number;
}

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

const COLORS = [
  { stripe: '#005B99', badge: 'b-blue' },
  { stripe: '#0D9488', badge: 'b-teal' },
  { stripe: '#B45309', badge: 'b-amber' },
  { stripe: '#5B21B6', badge: 'b-violet' },
  { stripe: '#9F1239', badge: 'b-rose' },
  { stripe: '#065F46', badge: 'b-emerald' },
];

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

export const MOCK_PROJECTS: Project[] = [];
