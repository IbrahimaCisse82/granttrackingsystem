import { useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

import { ChevronRight, LayoutDashboard, BookOpen, Users, Search, BarChart3, UserCircle, History, Building2 } from 'lucide-react';
import { getReportCount } from '@/lib/utils-project';
import OrgSwitcher from '@/components/OrgSwitcher';
import logo from '@/assets/logo-growhub.png';

function buildSectionTabs(periodicite: string) {
  const count = getReportCount(periodicite);
  const REPORT_COLORS = [
    '#065F46', '#1A5276', '#5B21B6', '#9F1239',
    '#0E7490', '#92400E', '#6D28D9', '#BE123C',
    '#047857', '#1E40AF', '#7C3AED', '#E11D48',
  ];
  const TRANS_COLORS = [
    '#059669', '#2980B9', '#7C3AED', '#E11D48',
    '#06B6D4', '#D97706', '#8B5CF6', '#F43F5E',
    '#10B981', '#3B82F6', '#A78BFA', '#FB7185',
  ];

  const base = [
    { id: 'infos', label: 'Informations générales', color: '#2563EB' },
    { id: 'budget', label: 'Budget (Annexe 1b)', color: '#B45309' },
    { id: 'fiche', label: 'Fiche récapitulative', color: '#0D9488' },
    { id: 'indicateurs', label: 'Suivi programmatique', color: '#059669' },
    { id: 'bailleurs', label: 'Bailleurs / Financements', color: '#6366F1' },
    { id: 'amendements', label: 'Amendements', color: '#7C3AED' },
  ];

  for (let i = 1; i <= count; i++) {
    base.push({
      id: `rapport-${i}`,
      label: `Rapport N° ${String(i).padStart(3, '0')}`,
      color: REPORT_COLORS[(i - 1) % REPORT_COLORS.length],
    });
    base.push({
      id: `trans-${i}`,
      label: `↳ Transactions REP ${String(i).padStart(2, '0')}`,
      color: TRANS_COLORS[(i - 1) % TRANS_COLORS.length],
    });
  }

  return base;
}

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { currentTab, openProjectIds, openProjectTab, toggleSidebarProject, sidebarSearch, setSidebarSearch } = useAppStore();
  const { projects } = useProjects();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const navTo = useCallback((path: string) => {
    navigate(path);
    onNavigate?.();
  }, [navigate, onNavigate]);

  const filteredProjects = useMemo(() => {
    if (!sidebarSearch) return projects.filter(p => !(p as any).archived);
    const q = sidebarSearch.toLowerCase();
    return projects.filter(p => !(p as any).archived && p.org.toLowerCase().includes(q));
  }, [projects, sidebarSearch]);

  const activeCount = useMemo(() => projects.filter(p => !(p as any).archived).length, [projects]);

  return (
    <aside className="flex w-[260px] h-full flex-col overflow-y-auto bg-sidebar border-r border-sidebar-border/5 print:hidden">
      {/* Brand + Org switcher */}
      <div className="border-b border-sidebar-border/10 p-5 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-md bg-card/90 p-1.5 px-2">
            <img src={logo} alt="Grow Hub" className="h-5 w-auto" />
          </div>
        </div>
        <OrgSwitcher />
        <p className="text-[10.5px] tracking-wide text-sidebar-foreground/30 uppercase mt-1">Grants Tracking System</p>
        
        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/30" />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher un projet"
            className="w-full rounded-md border border-sidebar-foreground/10 bg-sidebar-foreground/5 py-1.5 pl-8 pr-3 text-xs text-sidebar-foreground/70 placeholder:text-sidebar-foreground/25 outline-none focus:border-primary/60 focus:bg-sidebar-foreground/8"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2.5 pt-3" aria-label="Navigation principale">
        <p className="px-2 pb-1.5 text-[9.5px] font-semibold uppercase tracking-[1.2px] text-sidebar-foreground/25">Navigation</p>
        <NavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Portefeuille" active={currentPath === '/'} onClick={() => navTo('/')} />
        <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Dashboard" active={currentPath === '/dashboard'} onClick={() => navTo('/dashboard')} />
        <NavItem icon={<BookOpen className="w-4 h-4" />} label="Guide d'utilisation" active={currentPath === '/guide'} onClick={() => navTo('/guide')} />
        <NavItem icon={<Users className="w-4 h-4" />} label="Gestion utilisateurs" active={currentPath === '/admin'} onClick={() => navTo('/admin')} />
        <NavItem icon={<History className="w-4 h-4" />} label="Historique" active={currentPath === '/audit'} onClick={() => navTo('/audit')} />
        <NavItem icon={<Building2 className="w-4 h-4" />} label="Organisation" active={currentPath === '/organization'} onClick={() => navTo('/organization')} />
        <NavItem icon={<UserCircle className="w-4 h-4" />} label="Mon profil" active={currentPath === '/profile'} onClick={() => navTo('/profile')} />
      </nav>

      {/* Projects */}
      <div className="p-2.5 pt-1">
        <p className="px-2 pb-1.5 text-[9.5px] font-semibold uppercase tracking-[1.2px] text-sidebar-foreground/25">
          Projets · <span className="font-mono">{activeCount}</span> actif(s)
        </p>
        {filteredProjects.map(proj => {
          const isOpen = openProjectIds.includes(proj.id);
          const tabs = isOpen ? buildSectionTabs(proj.periodicite) : [];
          const isProjectActive = currentPath === `/projects/${proj.id}`;
          return (
            <div key={proj.id} className="border-t border-sidebar-foreground/5 mt-1 pt-1">
              <button
                onClick={() => {
                  toggleSidebarProject(proj.id);
                  navTo(`/projects/${proj.id}`);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 hover:bg-sidebar-foreground/5 transition-colors"
              >
                <span className="font-mono text-[10px] rounded px-1.5 py-0.5" style={{ background: proj.color.stripe + '22', color: proj.color.stripe }}>
                  {proj.convention.slice(0, 10)}
                </span>
                <span className="flex-1 truncate text-left text-xs font-medium text-sidebar-foreground/70">{proj.org}</span>
                <ChevronRight className={`w-3 h-3 text-sidebar-foreground/25 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>
              {isOpen && (
                <div className="pb-2 pl-2">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        openProjectTab(proj.id, tab.id);
                        navTo(`/projects/${proj.id}?tab=${tab.id}`);
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                        isProjectActive && currentTab === tab.id
                          ? 'bg-primary/20 text-sidebar-foreground/90'
                          : 'text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-foreground/5'
                      }`}
                    >
                      <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: tab.color }} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-sidebar-foreground/5 p-4">
        <button onClick={signOut} className="w-full rounded-md border border-sidebar-foreground/10 px-3 py-1.5 text-[11px] text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground/70 transition-colors">
          Déconnexion
        </button>
        <p className="mt-3 text-[10.5px] leading-relaxed text-sidebar-foreground/20">
          Grow Hub SARL · GH-GTS v3.0<br />
          © {new Date().getFullYear()} — Tous droits réservés
        </p>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-all ${
        active
          ? 'bg-primary/30 font-medium text-sidebar-foreground'
          : 'text-sidebar-foreground/50 hover:bg-sidebar-foreground/6 hover:text-sidebar-foreground/85'
      }`}
    >
      {active && <span className="absolute left-0 top-[5px] bottom-[5px] w-[2px] rounded-r bg-primary" />}
      {icon}
      {label}
    </button>
  );
}
