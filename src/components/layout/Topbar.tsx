import { useAppStore } from '@/lib/store';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { Save, Download, Bell, User, LogOut, FileDown } from 'lucide-react';
import { toast } from 'sonner';

const SECTION_LABELS: Record<string, string> = {
  infos: 'Informations générales',
  budget: 'Budget (Annexe 1b)',
  fiche: 'Fiche récapitulative',
  amendements: 'Amendements',
};

function getSectionLabel(tab: string): string {
  if (SECTION_LABELS[tab]) return SECTION_LABELS[tab];
  const rapportMatch = tab.match(/^rapport-(\d+)$/);
  if (rapportMatch) return `Rapport N° ${String(Number(rapportMatch[1])).padStart(3, '0')}`;
  const transMatch = tab.match(/^trans-(\d+)$/);
  if (transMatch) return `Transactions REP ${String(Number(transMatch[1])).padStart(2, '0')}`;
  return tab;
}

export default function Topbar() {
  const { currentPage, currentProjectId, currentTab, setPage, triggerForceSave } = useAppStore();
  const { projects } = useProjects();
  const { user, role, signOut } = useAuth();
  const project = projects.find(p => p.id === currentProjectId);

  const handleSave = () => {
    triggerForceSave();
    toast.success('Sauvegarde lancée');
  };

  const handleExportJSON = () => {
    if (!project) return;
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.convention || 'projet'}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export JSON téléchargé');
  };

  const handlePrint = () => {
    window.print();
  };

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
              <span className="font-medium text-foreground">{getSectionLabel(currentTab)}</span>
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
        {currentPage === 'project' && project && (
          <>
            <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-3 py-1.5 text-xs font-medium text-steel transition-colors hover:bg-paper hover:border-dim print:hidden">
              <Save className="w-3.5 h-3.5" /> Sauvegarder
            </button>
            <button onClick={handleExportJSON} className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-3 py-1.5 text-xs font-medium text-steel transition-colors hover:bg-paper hover:border-dim print:hidden">
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-3 py-1.5 text-xs font-medium text-steel transition-colors hover:bg-paper hover:border-dim print:hidden">
              <FileDown className="w-3.5 h-3.5" /> Imprimer / PDF
            </button>
          </>
        )}
        <button className="relative rounded-md border border-rule bg-card p-1.5 text-steel hover:bg-paper print:hidden">
          <Bell className="w-4 h-4" />
          <span className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-primary" />
        </button>
        <div className="flex items-center gap-2 rounded-md border border-rule bg-paper px-2.5 py-1 print:hidden">
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
