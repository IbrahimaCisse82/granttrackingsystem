import { useState, useMemo, useCallback } from 'react';
import { calcBudgetTotal, calcDepensesTotal, fmt } from '@/lib/utils-project';
import { useProjects } from '@/hooks/useProjects';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { exportPortfolioPDF } from '@/lib/export-dashboard-pdf';
import MetricCard from '@/components/MetricCard';
import ProjectCard from '@/components/ProjectCard';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import { Plus, FolderOpen, Loader2, Search, Filter, X, Archive, ChevronLeft, ChevronRight, ArrowUpDown, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectSortKey } from '@/hooks/useProjects';

const RISK_OPTIONS = ['Faible risque', 'Risque modéré', 'Risque important', 'Risque élevé'];
const SORT_OPTIONS: { value: ProjectSortKey; label: string }[] = [
  { value: 'created_at', label: 'Date de création' },
  { value: 'org', label: 'Organisation' },
  { value: 'debut', label: 'Date de début' },
  { value: 'fin', label: 'Date de fin' },
  { value: 'pays', label: 'Pays' },
];

export default function Portfolio() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [paysFilter, setPaysFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<ProjectSortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Debounce search
  const debounceTimer = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (debounceTimer[0]) clearTimeout(debounceTimer[0]);
    debounceTimer[0] = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 300);
  }, [debounceTimer]);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    risque: riskFilter || undefined,
    pays: paysFilter || undefined,
    archived: showArchived,
    page,
    sortBy,
    sortDir,
  }), [debouncedSearch, riskFilter, paysFilter, showArchived, page, sortBy, sortDir]);

  const { projects, totalCount, totalPages, currentPage, isLoading, isFetching } = useProjects(filters);

  // Separate count for archived badge — lightweight query
  const { totalCount: archivedCount } = useProjects({ archived: true, pageSize: 1 });
  const { totalCount: activeCount } = useProjects({ archived: false, pageSize: 1 });

  // Metrics from current visible page (for active projects, use activeCount query)
  const metrics = useMemo(() => {
    const totalBudget = projects.reduce((s, p) => s + calcBudgetTotal(p), 0);
    const totalDepenses = projects.reduce((s, p) => s + calcDepensesTotal(p), 0);
    const totalRapports = projects.reduce((s, p) => s + p.reports.filter(r => r.status === 'soumis' || r.status === 'valide').length, 0);
    return { totalBudget, totalDepenses, totalRapports };
  }, [projects]);

  // Get unique countries from current page for filter dropdown
  const countries = useMemo(() => [...new Set(projects.map(p => p.pays).filter(Boolean))].sort(), [projects]);

  const hasFilters = !!riskFilter || !!paysFilter;

  const handleFilterChange = useCallback((setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  }, []);

  const { activeOrgId } = useOrganization();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      let q = supabase
        .from('projects')
        .select('*')
        .order(sortBy, { ascending: sortDir === 'asc', nullsFirst: false });
      if (activeOrgId) q = q.eq('organization_id', activeOrgId);
      q = q.eq('archived', showArchived);
      if (riskFilter) q = q.eq('risque', riskFilter);
      if (paysFilter) q = q.eq('pays', paysFilter);
      if (debouncedSearch) {
        q = q.or(`org.ilike.%${debouncedSearch}%,convention.ilike.%${debouncedSearch}%,title.ilike.%${debouncedSearch}%`);
      }
      const { data, error } = await q.limit(2000);
      if (error) throw error;

      const rows = (data || []).map((r: any) => {
        const proj: any = {
          budgetLines: r.budget_lines || [],
          reports: r.reports || [],
          taux: Number(r.taux) || 1,
        };
        const budget = calcBudgetTotal(proj);
        const depenses = calcDepensesTotal(proj);
        return {
          convention: r.convention || '',
          org: r.org || '',
          title: r.title || '',
          pays: r.pays || '',
          risque: r.risque || '',
          debut: r.debut || '',
          fin: r.fin || '',
          budget,
          depenses,
          taux: budget > 0 ? Math.round((depenses / budget) * 100) : 0,
        };
      });

      exportPortfolioPDF(rows, {
        search: debouncedSearch,
        risque: riskFilter,
        pays: paysFilter,
        archived: showArchived,
        sortBy,
        sortDir,
      });
      toast.success(`${rows.length} projet(s) exporté(s)`);
    } catch (e: any) {
      toast.error('Erreur export: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  }, [activeOrgId, sortBy, sortDir, showArchived, riskFilter, paysFilter, debouncedSearch]);

  if (isLoading && !isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Portefeuille global</h1>
          <p className="text-xs text-muted-foreground mt-1">Vue d'ensemble de tous les projets de subvention</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting || totalCount === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-3 py-2 text-xs font-medium text-steel hover:bg-paper transition-colors disabled:opacity-50"
            aria-label="Exporter le portefeuille en PDF"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            Exporter PDF
          </button>
          <CreateProjectDialog />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <MetricCard label="Projets actifs" value={String(activeCount)} note="en cours" accentColor="blue" />
        <MetricCard label="Budget total" value={`${fmt(metrics.totalBudget)} €`} note="page courante" accentColor="teal" />
        <MetricCard label="Dépenses totales" value={`${fmt(metrics.totalDepenses)} €`} note="page courante" accentColor="amber" />
        <MetricCard label="Rapports soumis" value={String(metrics.totalRapports)} note="page courante" accentColor="emerald" />
      </div>

      {/* Search & Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher par organisation, convention ou titre…"
              aria-label="Rechercher un projet"
              className="w-full rounded-lg border border-rule bg-card py-2 pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
            />
            {search && (
              <button onClick={() => { setSearch(''); setDebouncedSearch(''); setPage(0); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-dim hover:text-foreground" aria-label="Effacer la recherche">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1 rounded-lg border border-rule bg-card px-2 py-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <label htmlFor="sort-by" className="sr-only">Trier par</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={e => { setSortBy(e.target.value as ProjectSortKey); setPage(0); }}
                className="bg-transparent text-xs outline-none cursor-pointer"
                aria-label="Critère de tri"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                type="button"
                onClick={() => { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); setPage(0); }}
                className="text-xs text-steel hover:text-primary px-1"
                aria-label={`Inverser le tri (actuellement ${sortDir === 'asc' ? 'croissant' : 'décroissant'})`}
                title={sortDir === 'asc' ? 'Croissant' : 'Décroissant'}
              >
                {sortDir === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            <button onClick={() => { setShowArchived(!showArchived); setPage(0); }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                showArchived ? 'border-amber bg-amber-light text-amber' : 'border-rule bg-card text-steel hover:bg-paper'
              }`}>
              <Archive className="w-3.5 h-3.5" />
              Archivés ({archivedCount})
            </button>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                hasFilters ? 'border-primary bg-enabel-light text-primary' : 'border-rule bg-card text-steel hover:bg-paper'
              }`}>
              <Filter className="w-3.5 h-3.5" />
              Filtres {hasFilters && `(${[riskFilter, paysFilter].filter(Boolean).length})`}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-rule bg-card p-3">
            <div className="flex items-center gap-2">
              <label htmlFor="risk-filter" className="text-[11px] font-medium text-steel whitespace-nowrap">Risque :</label>
              <select id="risk-filter" value={riskFilter} onChange={e => handleFilterChange(setRiskFilter)(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary">
                <option value="">Tous</option>
                {RISK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="country-filter" className="text-[11px] font-medium text-steel whitespace-nowrap">Pays :</label>
              <select id="country-filter" value={paysFilter} onChange={e => handleFilterChange(setPaysFilter)(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary">
                <option value="">Tous</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {hasFilters && (
              <button onClick={() => { setRiskFilter(''); setPaysFilter(''); setPage(0); }}
                className="text-[11px] text-primary hover:underline ml-2">
                Réinitialiser
              </button>
            )}
            <span className="ml-auto text-[11px] text-muted-foreground">{totalCount} projet(s) au total</span>
          </div>
        )}
      </div>

      {/* Loading overlay for page transitions */}
      <div className="relative">
        {isFetching && !isLoading && (
          <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {/* Project Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        ) : totalCount > 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-rule py-16 text-center">
            <Search className="w-10 h-10 text-dim mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Aucun résultat</p>
            <p className="text-xs text-muted-foreground">Modifiez vos critères de recherche ou filtres</p>
          </div>
        ) : !isLoading ? (
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
        ) : null}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-rule">
          <p className="text-[11px] text-muted-foreground">
            {currentPage * 12 + 1}–{Math.min((currentPage + 1) * 12, totalCount)} sur {totalCount} projets
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-rule text-xs disabled:opacity-40 hover:bg-paper transition-colors"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i).map(i => {
              // Show first, last, current, and neighbors
              if (i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1) {
                return (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-md border text-xs font-medium transition-colors ${
                      i === currentPage ? 'border-primary bg-primary text-primary-foreground' : 'border-rule hover:bg-paper'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              }
              if (i === 1 && currentPage > 2) return <span key={i} className="px-1 text-muted-foreground">…</span>;
              if (i === totalPages - 2 && currentPage < totalPages - 3) return <span key={i} className="px-1 text-muted-foreground">…</span>;
              return null;
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-rule text-xs disabled:opacity-40 hover:bg-paper transition-colors"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
