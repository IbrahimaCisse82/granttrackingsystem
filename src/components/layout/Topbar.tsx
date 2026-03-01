import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { Save, Download, Bell, User, LogOut } from 'lucide-react';

const SECTION_LABELS: Record<string, string> = {
  infos: 'Informations générales',
  budget: 'Budget (Annexe 1b)',
  fiche: 'Fiche récapitulative',
  'rapport-1': 'Rapport N° 001', 'trans-1': 'Transactions REP 01',
  'rapport-2': 'Rapport N° 002', 'trans-2': 'Transactions REP 02',
  'rapport-3': 'Rapport N° 003', 'trans-3': 'Transactions REP 03',
  'rapport-4': 'Rapport N° 004', 'trans-4': 'Transactions REP 04',
};

export default function Topbar() {
  const { currentPage, currentProjectId, currentTab, projects, setPage } = useAppStore();
  const { user, role, signOut } = useAuth();
  const project = projects.find(p => p.id === currentProjectId);

  return (
    <header className="sticky top-0 z-40 flex h-[52px] items-center justify-between border-b border-rule bg-card px-7 shadow-[0_1px_0_hsl(var(--rule))]">
      <div className="flex items-center gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <button onClick={() => setPage('portfolio')} className="hover:text-foreground transition-colors">Grow Hub GTS</button>
          {currentPage === 'project' && project && (
            <>
              <span className="text-dim">›</span>
              <button onClick={() => setPage('portfolio')} className="hover:text-foreground transition-colors">{project.org}</button>
              <span className="text-dim">›</span>
              <span className="font-medium text-foreground">{SECTION_LABELS[currentTab] || currentTab}</span>
            </>
          )}
          {currentPage === 'tutoriel' && (
            <>
              <span className="text-dim">›</span>
              <span className="font-medium text-foreground">Guide d'utilisation</span>
            </>
          )}
          {currentPage === 'admin' && (
            <>
              <span className="text-dim">›</span>
              <span className="font-medium text-foreground">Gestion utilisateurs</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-3 py-1.5 text-xs font-medium text-steel transition-colors hover:bg-paper hover:border-dim">
          <Save className="w-3.5 h-3.5" /> Sauvegarder
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-3 py-1.5 text-xs font-medium text-steel transition-colors hover:bg-paper hover:border-dim">
          <Download className="w-3.5 h-3.5" /> Export JSON
        </button>
        <button className="relative rounded-md border border-rule bg-card p-1.5 text-steel hover:bg-paper">
          <Bell className="w-4 h-4" />
          <span className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-primary" />
        </button>
        <div className="flex items-center gap-2 rounded-md border border-rule bg-paper px-2.5 py-1">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-xs font-medium text-ink-3">{role ?? '…'}</span>
          <button onClick={signOut} className="ml-1 p-1 rounded hover:bg-muted transition-colors" title="Déconnexion">
            <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
