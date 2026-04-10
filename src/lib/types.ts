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
  bailleurs?: any[];
  createdAt: number;
}
