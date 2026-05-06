import { useState } from 'react';
import { BookOpen, LayoutDashboard, FileText, DollarSign, ClipboardList, Users, Shield, Receipt, Eye, Briefcase, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Section { icon: JSX.Element; title: string; content: string; }

const COMMON: Section[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, title: 'Portefeuille & Dashboard',
    content: 'Le Portefeuille liste tous vos projets accessibles avec budget, dépenses et risque. Le Dashboard agrège les indicateurs (répartition budgétaire A/B, évolution des dépenses, distribution des risques, top bailleurs).' },
  { icon: <BookOpen className="w-5 h-5" />, title: 'Notifications & aide contextuelle',
    content: 'Les notifications en haut à droite signalent les soumissions, approbations et échéances. Le bouton « ? » flottant ouvre un panneau d\'aide adapté à la page courante.' },
];

const ADMIN: Section[] = [
  { icon: <Users className="w-5 h-5" />, title: 'Gestion des utilisateurs',
    content: 'Depuis /admin, créez des comptes par invitation, attribuez les rôles (Admin, Manager, Lecteur, Bénéficiaire) et révoquez les accès. Les bénéficiaires doivent ensuite être assignés à un projet via l\'onglet Bénéficiaires du projet.' },
  { icon: <DollarSign className="w-5 h-5" />, title: 'Devises & taux de change',
    content: 'Dans Paramètres organisation → Devises, ajoutez les paires utilisées (EUR, USD, GBP…). Le taux FCFA→EUR de 655,957 reste actif par défaut. Chaque transaction peut utiliser son propre taux du jour.' },
  { icon: <Shield className="w-5 h-5" />, title: 'Workflow d\'approbation',
    content: 'Les rapports périodiques et amendements suivent un workflow Brouillon → Soumis → Approuvé/Rejeté. Seuls les admin et owner peuvent approuver. Une notification est envoyée à chaque transition et un rappel automatique est déclenché 48h avant la deadline.' },
  { icon: <Receipt className="w-5 h-5" />, title: 'Audit trail',
    content: 'Toutes les opérations sensibles (transactions, vouchers, rapports, amendements) sont tracées dans /audit avec utilisateur, action et horodatage. Les transactions ne se suppriment pas — utilisez la contre-passe.' },
];

const MANAGER: Section[] = [
  { icon: <FileText className="w-5 h-5" />, title: 'Créer & piloter un projet',
    content: 'Créez la convention (numéro, organisation, titre, pays, devise, dates). Saisissez le budget en deux sections A (opérationnel) et B (gestion). Ajoutez les bailleurs et leurs contributions.' },
  { icon: <ClipboardList className="w-5 h-5" />, title: 'Rapports périodiques',
    content: 'Renseignez Dépenses engagées, Prévisions et Réconciliation. Soumettez le rapport pour validation. Vous ne pouvez pas auto-approuver.' },
  { icon: <Receipt className="w-5 h-5" />, title: 'Fiches de versement',
    content: 'Liez à un rapport validé une fiche : numéro, montant local, devise, taux, date de paiement, références. Exportez en PDF pour le bailleur. Marquez-la « reçue » à réception effective.' },
  { icon: <DollarSign className="w-5 h-5" />, title: 'Transactions & contre-passes',
    content: 'Saisissez code budgétaire, voucher, bénéficiaire, montant, taux et justificatif. Pour corriger une transaction validée, utilisez la contre-passe (motif obligatoire) — la suppression est interdite.' },
];

const BENEFICIAIRE: Section[] = [
  { icon: <Briefcase className="w-5 h-5" />, title: 'Vos projets assignés',
    content: 'Le Portefeuille n\'affiche que les projets où vous êtes assigné·e comme bénéficiaire. Vous voyez les informations descriptives mais pas les détails budgétaires ni les transactions financières.' },
  { icon: <FileText className="w-5 h-5" />, title: 'Rapports de terrain',
    content: 'Depuis /field-reports, créez un rapport narratif avec indicateurs et pièces jointes pour la période. Statuts : Brouillon → Soumis → Revu. Vous ne voyez que vos propres soumissions.' },
];

const LECTEUR: Section[] = [
  { icon: <Eye className="w-5 h-5" />, title: 'Mode lecture seule',
    content: 'Vous pouvez consulter et exporter (PDF/Excel) toutes les données de l\'organisation, mais aucune création ni modification n\'est possible. Les boutons d\'édition sont masqués.' },
];

function List({ items }: { items: Section[] }) {
  return (
    <div className="space-y-3">
      {items.map((s, i) => (
        <div key={i} className="flex items-start gap-3 rounded-[10px] border bg-card p-4">
          <div className="text-primary shrink-0">{s.icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{s.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Guide() {
  const [tab, setTab] = useState('admin');
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Guide d'utilisation</h1>
        <p className="text-xs text-muted-foreground mt-1">GH-GTS · Documentation par rôle</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-[10px] border border-primary/30 bg-primary/5 p-4 text-xs text-foreground mb-6">
        <BookOpen className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
        <div>
          Sélectionnez votre rôle ci-dessous. Les sections « Commun » s'appliquent à tous.
          <span className="inline-flex items-center gap-1 ml-1 text-primary">En savoir plus <ArrowRight className="w-3 h-3" /></span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="manager">Manager</TabsTrigger>
          <TabsTrigger value="beneficiaire">Bénéficiaire</TabsTrigger>
          <TabsTrigger value="lecteur">Lecteur</TabsTrigger>
          <TabsTrigger value="commun">Commun</TabsTrigger>
        </TabsList>
        <TabsContent value="admin"><List items={ADMIN} /></TabsContent>
        <TabsContent value="manager"><List items={MANAGER} /></TabsContent>
        <TabsContent value="beneficiaire"><List items={BENEFICIAIRE} /></TabsContent>
        <TabsContent value="lecteur"><List items={LECTEUR} /></TabsContent>
        <TabsContent value="commun"><List items={COMMON} /></TabsContent>
      </Tabs>
    </div>
  );
}
