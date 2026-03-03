export interface BudgetLine {
  code: string;
  section: 'A' | 'B';
  desc: string;
  unite: string;
  qty: number;
  montant: number;
  allocation: number;
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

function createEmptyReport(): Report {
  return {
    status: 'vide', dateSubmit: '', periodeDebut: '', periodeFin: '',
    depenses: {}, previsions: {}, explanation: {}, transactions: [],
  };
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    convention: 'CST/2024/SN/001',
    org: 'Association Djolof Développement',
    orgType: 'Privé à but non lucratif',
    title: "Appui au développement de l'entrepreneuriat rural au Sénégal",
    pays: 'Sénégal',
    devise: 'XOF',
    taux: 655.96,
    risque: 'Faible risque',
    debut: '2024-01-15',
    fin: '2025-06-30',
    periodicite: 'Trimestriel',
    color: COLORS[0],
    budgetLines: [
      { code: 'A1.1.1', section: 'A', desc: 'Personnel du projet', unite: 'Mois', qty: 18, montant: 2500, allocation: 80 },
      { code: 'A1.1.2', section: 'A', desc: 'Formation des bénéficiaires', unite: 'Session', qty: 12, montant: 1800, allocation: 100 },
      { code: 'A1.1.3', section: 'A', desc: 'Équipement et matériel', unite: 'Forfait', qty: 1, montant: 15000, allocation: 100 },
      { code: 'A1.1.4', section: 'A', desc: 'Transport et déplacements', unite: 'Mois', qty: 18, montant: 800, allocation: 100 },
      { code: 'A1.1.5', section: 'A', desc: "Suivi et évaluation", unite: 'Forfait', qty: 2, montant: 5000, allocation: 100 },
      { code: 'B.1', section: 'B', desc: 'Frais administratifs', unite: 'Forfait', qty: 1, montant: 8000, allocation: 100 },
      { code: 'B.2', section: 'B', desc: 'Audit externe', unite: 'Forfait', qty: 1, montant: 4500, allocation: 100 },
    ],
    reports: [
      {
        status: 'soumis', dateSubmit: '2024-04-15', periodeDebut: '2024-01-15', periodeFin: '2024-03-31',
        depenses: { 'A1.1.1': 8500, 'A1.1.2': 5200, 'A1.1.3': 12000, 'A1.1.4': 3200, 'A1.1.5': 0, 'B.1': 2000, 'B.2': 0 },
        previsions: {}, explanation: {}, transactions: [
          { id: 't1', code: 'A1.1.1', date: '2024-02-01', voucher: 'V-001', beneficiaire: 'M. Diallo', montantDevise: 1500000, tauxChange: 655.96, montantEUR: 2286.15, description: 'Salaire coordinateur' },
          { id: 't2', code: 'A1.1.2', date: '2024-02-15', voucher: 'V-002', beneficiaire: 'Hotel Teranga', montantDevise: 850000, tauxChange: 655.96, montantEUR: 1295.63, description: 'Formation session 1' },
          { id: 't3', code: 'A1.1.3', date: '2024-03-01', voucher: 'V-003', beneficiaire: 'TechShop Dakar', montantDevise: 7800000, tauxChange: 655.96, montantEUR: 11891.15, description: 'Achat équipements' },
        ],
      },
      {
        status: 'en_cours', dateSubmit: '', periodeDebut: '2024-04-01', periodeFin: '2024-06-30',
        depenses: { 'A1.1.1': 7800, 'A1.1.2': 3600, 'A1.1.4': 2400 },
        previsions: {}, explanation: {}, transactions: [],
      },
      createEmptyReport(),
      createEmptyReport(),
    ],
    fiches: { versements: [
      { periode: 'Q1 2024', dateSoumission: '2024-04-15', montantDeclare: 30900, montantValide: 29500, versement: '1er versement', datePaiement: '2024-05-01', montantRecu: 29500 },
      { periode: 'Q2 2024', dateSoumission: '', montantDeclare: 0, montantValide: 0, versement: '2ème versement', datePaiement: '', montantRecu: 0 },
      { periode: 'Q3 2024', dateSoumission: '', montantDeclare: 0, montantValide: 0, versement: '3ème versement', datePaiement: '', montantRecu: 0 },
      { periode: 'Q4 2024', dateSoumission: '', montantDeclare: 0, montantValide: 0, versement: '4ème versement', datePaiement: '', montantRecu: 0 },
    ] },
    amendements: [],
    infos: { submitDate: '2024-01-10', preparedBy: 'Amadou Ba', version: 'initial', scoreRisque: '25' },
    createdAt: Date.now() - 8640000000,
  },
  {
    id: 'p2',
    convention: 'CST/2024/UG/002',
    org: 'Green Future Uganda',
    orgType: 'Privé à but non lucratif',
    title: "Programme d'agroforesterie communautaire dans le district de Kabarole",
    pays: 'Ouganda',
    devise: 'UGX',
    taux: 4150,
    risque: 'Risque modéré',
    debut: '2024-03-01',
    fin: '2025-12-31',
    periodicite: 'Semestriel',
    color: COLORS[1],
    budgetLines: [
      { code: 'A1.1.1', section: 'A', desc: 'Coordinateur de projet', unite: 'Mois', qty: 22, montant: 3200, allocation: 75 },
      { code: 'A1.1.2', section: 'A', desc: 'Pépinières communautaires', unite: 'Site', qty: 8, montant: 4500, allocation: 100 },
      { code: 'A1.1.3', section: 'A', desc: 'Formation agroforesterie', unite: 'Session', qty: 16, montant: 1200, allocation: 100 },
      { code: 'A1.1.4', section: 'A', desc: 'Matériel agricole', unite: 'Lot', qty: 4, montant: 6000, allocation: 100 },
      { code: 'B.1', section: 'B', desc: 'Frais de gestion', unite: 'Forfait', qty: 1, montant: 12000, allocation: 100 },
    ],
    reports: [
      {
        status: 'valide', dateSubmit: '2024-09-10', periodeDebut: '2024-03-01', periodeFin: '2024-08-31',
        depenses: { 'A1.1.1': 18000, 'A1.1.2': 22000, 'A1.1.3': 8400, 'A1.1.4': 12000, 'B.1': 5000 },
        previsions: {}, explanation: {}, transactions: [],
      },
      createEmptyReport(),
      createEmptyReport(),
      createEmptyReport(),
    ],
    fiches: { versements: [
      { periode: 'S1 2024', dateSoumission: '2024-09-10', montantDeclare: 65400, montantValide: 63000, versement: '1er versement', datePaiement: '2024-10-01', montantRecu: 63000 },
      { periode: 'S2 2024', dateSoumission: '', montantDeclare: 0, montantValide: 0, versement: '2ème versement', datePaiement: '', montantRecu: 0 },
      { periode: 'S1 2025', dateSoumission: '', montantDeclare: 0, montantValide: 0, versement: '3ème versement', datePaiement: '', montantRecu: 0 },
      { periode: 'S2 2025', dateSoumission: '', montantDeclare: 0, montantValide: 0, versement: '4ème versement', datePaiement: '', montantRecu: 0 },
    ] },
    amendements: [],
    infos: { submitDate: '2024-02-20', preparedBy: 'Sarah Nakamya', version: 'initial', scoreRisque: '45' },
    createdAt: Date.now() - 5000000000,
  },
  {
    id: 'p3',
    convention: 'CST/2024/CD/003',
    org: 'Fondation Maisha RDC',
    orgType: 'Publique',
    title: "Renforcement des capacités des coopératives minières artisanales au Sud-Kivu",
    pays: 'RD Congo',
    devise: 'CDF',
    taux: 2780,
    risque: 'Risque élevé',
    debut: '2024-06-01',
    fin: '2026-05-31',
    periodicite: 'Trimestriel',
    color: COLORS[3],
    budgetLines: [
      { code: 'A1.1.1', section: 'A', desc: 'Équipe technique', unite: 'Mois', qty: 24, montant: 4000, allocation: 85 },
      { code: 'A1.1.2', section: 'A', desc: "Ateliers de sensibilisation", unite: 'Atelier', qty: 20, montant: 2200, allocation: 100 },
      { code: 'A1.1.3', section: 'A', desc: "Équipement de sécurité", unite: 'Kit', qty: 200, montant: 150, allocation: 100 },
      { code: 'B.1', section: 'B', desc: 'Frais administratifs et audit', unite: 'Forfait', qty: 1, montant: 18000, allocation: 100 },
    ],
    reports: [createEmptyReport(), createEmptyReport(), createEmptyReport(), createEmptyReport()],
    fiches: { versements: [
      { periode: 'Q3 2024', dateSoumission: '', montantDeclare: 0, montantValide: 0, versement: '1er versement', datePaiement: '', montantRecu: 0 },
      { periode: 'Q4 2024', dateSoumission: '', montantDeclare: 0, montantValide: 0, versement: '2ème versement', datePaiement: '', montantRecu: 0 },
      { periode: 'Q1 2025', dateSoumission: '', montantDeclare: 0, montantValide: 0, versement: '3ème versement', datePaiement: '', montantRecu: 0 },
      { periode: 'Q2 2025', dateSoumission: '', montantDeclare: 0, montantValide: 0, versement: '4ème versement', datePaiement: '', montantRecu: 0 },
    ] },
    amendements: [],
    infos: { submitDate: '2024-05-15', preparedBy: 'Patrick Mulumba', version: 'initial', scoreRisque: '78' },
    createdAt: Date.now() - 2000000000,
  },
];
