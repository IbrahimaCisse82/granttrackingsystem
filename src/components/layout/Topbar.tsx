import { useAppStore } from '@/lib/store';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Save, Download, Bell, User, LogOut, FileDown, FileSpreadsheet, Upload, Sun, Moon, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { exportBudgetPDF, exportReportPDF, exportTransactionsPDF } from '@/lib/export-pdf';
import { exportBudgetExcel, exportFullProjectExcel } from '@/lib/export-excel';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Project } from '@/lib/types';

function getSectionLabel(tab: string): string {
  const LABELS: Record<string, string> = {
    infos: 'Informations générales',
    budget: 'Budget (Annexe 1b)',
    fiche: 'Fiche récapitulative',
    amendements: 'Amendements',
    indicateurs: 'Suivi programmatique',
    bailleurs: 'Bailleurs / Financements',
  };
  if (LABELS[tab]) return LABELS[tab];
  const rapportMatch = tab.match(/^rapport-(\d+)$/);
  if (rapportMatch) return `Rapport N° ${String(Number(rapportMatch[1])).padStart(3, '0')}`;
  const transMatch = tab.match(/^trans-(\d+)$/);
  if (transMatch) return `Transactions REP ${String(Number(transMatch[1])).padStart(2, '0')}`;
  return tab;
}

interface TopbarProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export default function Topbar({ onMenuToggle, showMenuButton }: TopbarProps) {
  const { currentTab, triggerForceSave } = useAppStore();
  const { projects, addProject } = useProjects();
  const { role, signOut } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const { darkMode, toggle: toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const projectId = params.projectId;
  const isProjectPage = location.pathname.startsWith('/projects/');
  const isPortfolioPage = location.pathname === '/';
  const project = projects.find(p => p.id === projectId);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSave = useCallback(() => {
    triggerForceSave();
    toast.success('Sauvegarde lancée');
  }, [triggerForceSave]);

  const handleExportJSON = useCallback(() => {
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
    setShowExport(false);
  }, [project]);

  const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const { id, createdAt, userId, ...rest } = data;
        await addProject(rest as Omit<Project, 'id' | 'createdAt'>);
        toast.success('Projet importé avec succès');
      } catch {
        toast.error('Fichier JSON invalide');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [addProject]);

  const handleExportPDF = useCallback(() => {
    if (!project) return;
    if (currentTab === 'budget') {
      exportBudgetPDF(project);
    } else if (currentTab.startsWith('rapport-')) {
      const idx = parseInt(currentTab.split('-')[1]) - 1;
      exportReportPDF(project, idx);
    } else if (currentTab.startsWith('trans-')) {
      const idx = parseInt(currentTab.split('-')[1]) - 1;
      exportTransactionsPDF(project, idx);
    } else {
      exportBudgetPDF(project);
    }
    toast.success('PDF exporté');
    setShowExport(false);
  }, [project, currentTab]);

  const handleExportExcel = useCallback(() => {
    if (!project) return;
    if (currentTab === 'budget') {
      exportBudgetExcel(project);
    } else {
      exportFullProjectExcel(project);
    }
    toast.success('Excel exporté');
    setShowExport(false);
  }, [project, currentTab]);

  const unread = unreadCount();

  return (
    <header className="sticky top-0 z-40 flex h-[52px] items-center justify-between border-b border-rule bg-card px-4 sm:px-7 shadow-[0_1px_0_hsl(var(--rule))] print:hidden">
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />

      <div className="flex items-center gap-3">
        {showMenuButton && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden rounded-md p-1.5 text-steel hover:bg-muted transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Fil d'Ariane">
          <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors hidden sm:inline">Grow Hub GTS</button>
          {isProjectPage && project && (
            <>
              <span className="text-dim hidden sm:inline">›</span>
              <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-none">{project.org}</button>
              <span className="text-dim">›</span>
              <span className="font-medium text-foreground truncate max-w-[100px] sm:max-w-none">{getSectionLabel(currentTab)}</span>
            </>
          )}
          {location.pathname === '/guide' && (<><span className="text-dim">›</span><span className="font-medium text-foreground">Guide d'utilisation</span></>)}
          {location.pathname === '/admin' && (<><span className="text-dim">›</span><span className="font-medium text-foreground">Gestion utilisateurs</span></>)}
          {location.pathname === '/dashboard' && (<><span className="text-dim">›</span><span className="font-medium text-foreground">Tableau de bord</span></>)}
          {location.pathname === '/organization' && (<><span className="text-dim">›</span><span className="font-medium text-foreground">Organisation</span></>)}
          {location.pathname === '/audit' && (<><span className="text-dim">›</span><span className="font-medium text-foreground">Historique</span></>)}
          {location.pathname === '/profile' && (<><span className="text-dim">›</span><span className="font-medium text-foreground">Mon profil</span></>)}
        </nav>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {isProjectPage && project && (
          <>
            <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-2 sm:px-3 py-1.5 text-xs font-medium text-steel transition-colors hover:bg-paper hover:border-dim">
              <Save className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sauvegarder</span>
            </button>

            <div className="relative" ref={exportRef}>
              <button onClick={() => setShowExport(!showExport)} className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-2 sm:px-3 py-1.5 text-xs font-medium text-steel transition-colors hover:bg-paper hover:border-dim">
                <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exporter ▾</span>
              </button>
              {showExport && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-rule bg-card shadow-md z-50">
                  <button onClick={handleExportPDF} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-paper transition-colors rounded-t-lg">
                    <FileDown className="w-3.5 h-3.5 text-rose" /> Export PDF (section)
                  </button>
                  <button onClick={handleExportExcel} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-paper transition-colors">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald" /> Export Excel
                  </button>
                  <button onClick={handleExportJSON} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-paper transition-colors">
                    <Download className="w-3.5 h-3.5 text-primary" /> Export JSON
                  </button>
                  <div className="border-t border-rule" />
                  <button onClick={() => { fileInputRef.current?.click(); setShowExport(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-paper transition-colors rounded-b-lg">
                    <Upload className="w-3.5 h-3.5 text-amber" /> Importer JSON
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {isPortfolioPage && (
          <button onClick={() => fileInputRef.current?.click()} className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-3 py-1.5 text-xs font-medium text-steel transition-colors hover:bg-paper hover:border-dim">
            <Upload className="w-3.5 h-3.5" /> Importer JSON
          </button>
        )}

        <button onClick={toggleDarkMode} className="rounded-md border border-rule bg-card p-1.5 text-steel hover:bg-paper transition-colors" title="Basculer thème" aria-label="Basculer mode sombre">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifs(!showNotifs)} className="relative rounded-md border border-rule bg-card p-1.5 text-steel hover:bg-paper" aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ''}`}>
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 min-w-[14px] h-3.5 rounded-full bg-rose text-[9px] font-bold text-primary-foreground flex items-center justify-center px-0.5">
                {unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-1 w-80 rounded-lg border border-rule bg-card shadow-md z-50">
              <div className="flex items-center justify-between border-b border-rule px-3 py-2">
                <span className="text-xs font-semibold">Notifications</span>
                <div className="flex gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">Tout lire</button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearAll} className="text-[10px] text-muted-foreground hover:underline">Effacer</button>
                  )}
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground italic">Aucune notification</p>
                ) : notifications.map(n => (
                  <button key={n.id} onClick={() => markRead(n.id)}
                    className={`flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-paper transition-colors border-b border-rule-2 last:border-b-0 ${!n.read ? 'bg-enabel-light/50' : ''}`}>
                    <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                    <div>
                      <p className="text-[11px] font-semibold">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground">{n.message}</p>
                      <p className="text-[9px] text-dim mt-0.5">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-md border border-rule bg-paper px-2.5 py-1">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-xs font-medium text-ink-3">{role ?? '…'}</span>
          <button onClick={signOut} className="ml-1 p-1 rounded hover:bg-muted transition-colors" title="Déconnexion" aria-label="Déconnexion">
            <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
