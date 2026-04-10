import { useState, useMemo } from 'react';
import { calcBudgetTotal, calcDepensesTotal, fmt, getReportCount } from '@/lib/utils-project';
import { useProjects } from '@/hooks/useProjects';
import MetricCard from '@/components/MetricCard';
import ProjectCard from '@/components/ProjectCard';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import { Plus, FolderOpen, Loader2, Search, Filter, X, Archive } from 'lucide-react';

const RISK_OPTIONS = ['Faible risque', 'Risque modéré', 'Risque important', 'Risque élevé'];

export default function Portfolio() {
  const { projects, isLoading } = useProjects();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [paysFilter, setPaysFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Unique countries
  const countries = useMemo(() => [...new Set(projects.map(p => p.pays).filter(Boolean))].sort(), [projects]);

  // Filtered projects
  const filtered = useMemo(() => {
    return projects.filter(p => {
      const isArchived = (p as any).archived ?? false;
      if (!showArchived && isArchived) return false;
      if (showArchived && !isArchived) return false;
      const q = search.toLowerCase();
      const matchSearch = !q || p.org.toLowerCase().includes(q) || p.convention.toLowerCase().includes(q) || p.title.toLowerCase().includes(q);
      const matchRisk = !riskFilter || p.risque === riskFilter;
      const matchPays = !paysFilter || p.pays === paysFilter;
      return matchSearch && matchRisk && matchPays;
    });
  }, [projects, search, riskFilter, paysFilter, showArchived]);

  const hasFilters = !!riskFilter || !!paysFilter;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeProjects = projects.filter(p => !(p as any).archived);
  const archivedProjects = projects.filter(p => (p as any).archived);
  const totalBudget = activeProjects.reduce((s, p) => s + calcBudgetTotal(p), 0);
  const totalDepenses = activeProjects.reduce((s, p) => s + calcDepensesTotal(p), 0);
  const totalRapports = activeProjects.reduce((s, p) => s + p.reports.filter(r => r.status === 'soumis' || r.status === 'valide').length, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Portefeuille global</h1>
          <p className="text-xs text-muted-foreground mt-1">Vue d'ensemble de tous les projets de subvention Grow Hub SARL</p>
        </div>
        <CreateProjectDialog />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        <MetricCard label="Projets actifs" value={String(activeProjects.length)} note="en cours" accentColor="blue" />
        <MetricCard label="Budget total" value={`${fmt(totalBudget)} €`} note="consolidé" accentColor="teal" />
        <MetricCard label="Dépenses totales" value={`${fmt(totalDepenses)} €`} note="engagées" accentColor="amber" />
        <MetricCard label="Rapports soumis" value={String(totalRapports)} note="sur tous les projets" accentColor="emerald" />
      </div>

      {/* Search & Filters */}
      {projects.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par organisation, convention ou titre…"
                className="w-full rounded-lg border border-rule bg-card py-2 pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-dim hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button onClick={() => setShowArchived(!showArchived)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                showArchived ? 'border-amber bg-amber-light text-amber' : 'border-rule bg-card text-steel hover:bg-paper'
              }`}>
              <Archive className="w-3.5 h-3.5" />
              Archivés ({archivedProjects.length})
            </button>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                hasFilters ? 'border-primary bg-enabel-light text-primary' : 'border-rule bg-card text-steel hover:bg-paper'
              }`}>
              <Filter className="w-3.5 h-3.5" />
              Filtres {hasFilters && `(${[riskFilter, paysFilter].filter(Boolean).length})`}
            </button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-3 rounded-lg border border-rule bg-card p-3">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-steel whitespace-nowrap">Risque :</label>
                <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary">
                  <option value="">Tous</option>
                  {RISK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-steel whitespace-nowrap">Pays :</label>
                <select value={paysFilter} onChange={e => setPaysFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary">
                  <option value="">Tous</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {hasFilters && (
                <button onClick={() => { setRiskFilter(''); setPaysFilter(''); }}
                  className="text-[11px] text-primary hover:underline ml-2">
                  Réinitialiser
                </button>
              )}
              <span className="ml-auto text-[11px] text-muted-foreground">{filtered.length} / {projects.length} projet(s)</span>
            </div>
          )}
        </div>
      )}

      {/* Project Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      ) : projects.length > 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-rule py-16 text-center">
          <Search className="w-10 h-10 text-dim mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Aucun résultat</p>
          <p className="text-xs text-muted-foreground">Modifiez vos critères de recherche ou filtres</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-rule py-20 text-center">
          <FolderOpen className="w-12 h-12 text-dim mb-4" />
          <p className="text-sm font-semibold text-foreground mb-1">Aucun projet</p>
          <p className="text-xs text-muted-foreground mb-4">Créez votre premier projet de subvention</p>
          <CreateProjectDialog trigger={
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
              <Plus className="w-3.5 h-3.5" /> Créer un projet
            </button>
          } />
        </div>
      )}
    </div>
  );
}
