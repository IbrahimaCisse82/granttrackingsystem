import { BookOpen, LayoutDashboard, FileText, DollarSign, ClipboardList, Users, Shield, ArrowRight } from 'lucide-react';

const sections = [
  {
    icon: <LayoutDashboard className="w-5 h-5" />,
    title: 'Portefeuille & Dashboard',
    content: 'La page Portefeuille affiche tous vos projets sous forme de cartes avec les métriques clés (budget, dépenses, risque). Le Dashboard fournit une vue analytique avec graphiques de répartition budgétaire, évolution des dépenses et distribution des risques.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Créer un projet',
    content: 'Cliquez sur "Nouveau projet" pour créer une convention. Renseignez le numéro de convention, l\'organisation bénéficiaire, le titre, le pays, la devise et les dates. Chaque projet est automatiquement structuré avec les onglets : Infos, Budget, Fiches, Rapports et Transactions.',
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    title: 'Budget (Annexe 1b)',
    content: 'L\'onglet Budget permet de saisir les lignes budgétaires en deux sections : A (Coûts opérationnels) et B (Frais de gestion). Les montants sont saisis en FCFA et automatiquement convertis en EUR au taux de 655,957. Vous pouvez ajouter, modifier ou supprimer des lignes.',
  },
  {
    icon: <ClipboardList className="w-5 h-5" />,
    title: 'Rapports financiers',
    content: 'Chaque rapport contient trois sous-sections : Dépenses engagées (réel de la période), Dépenses prévues (prévisions pour les périodes suivantes) et Réconciliation (comparaison budget vs dépenses avec avances et soldes). Les rapports passent par un workflow : Vide → En cours → Soumis → Validé.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Transactions',
    content: 'Chaque rapport est lié à une liste de transactions détaillées avec : code budgétaire, date, N° voucher, bénéficiaire, montant en devise locale, taux de change et montant EUR (calculé automatiquement). La variance entre le total des transactions et le rapport est affichée.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Amendements budgétaires',
    content: 'Les amendements (addenda) permettent de modifier le budget initial. Créez un amendement, ajoutez des lignes delta par code budgétaire, puis soumettez-le pour approbation. Statuts : Brouillon → Soumis → Approuvé/Rejeté.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Gestion des utilisateurs',
    content: 'Les administrateurs peuvent créer des comptes, attribuer des rôles (Admin, Manager, Lecteur, Bénéficiaire) et gérer les accès. Chaque rôle a des permissions spécifiques : les bénéficiaires gèrent leurs projets, les managers supervisent, les admins ont un accès complet.',
  },
];

export default function Guide() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Guide d'utilisation</h1>
        <p className="text-xs text-muted-foreground mt-1">GH-GTS · Grants Tracking System — Documentation fonctionnelle</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-[10px] border border-primary/30 bg-enabel-light p-4 text-xs text-enabel-dark mb-6">
        <BookOpen className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold mb-1">Bienvenue sur GH-GTS</p>
          <p>Ce système permet le suivi financier complet des projets de subvention : budget, rapports, transactions, amendements et réconciliation. Toutes les modifications sont sauvegardées automatiquement.</p>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className="rounded-[10px] border border-rule bg-card overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-enabel-light p-2 text-primary shrink-0 mt-0.5">{s.icon}</div>
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[10px] bg-ink text-sidebar-foreground p-4">
        <p className="text-xs font-semibold mb-1">Raccourcis clavier</p>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-sidebar-foreground/70">
          <div className="flex items-center gap-2"><kbd className="rounded bg-sidebar-foreground/10 px-1.5 py-0.5 font-mono text-[10px]">Double-clic</kbd> Ouvrir un projet</div>
          <div className="flex items-center gap-2"><kbd className="rounded bg-sidebar-foreground/10 px-1.5 py-0.5 font-mono text-[10px]">Recherche</kbd> Filtrer la sidebar</div>
        </div>
      </div>
    </div>
  );
}
