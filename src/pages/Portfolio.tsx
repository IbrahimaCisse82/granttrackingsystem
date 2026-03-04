import { calcBudgetTotal, calcDepensesTotal, fmt } from '@/lib/mock-data';
import { useProjects } from '@/hooks/useProjects';
import MetricCard from '@/components/MetricCard';
import ProjectCard from '@/components/ProjectCard';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import { Plus, FolderOpen, Loader2 } from 'lucide-react';

export default function Portfolio() {
  const { projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalBudget = projects.reduce((s, p) => s + calcBudgetTotal(p), 0);
  const totalDepenses = projects.reduce((s, p) => s + calcDepensesTotal(p), 0);
  const totalRapports = projects.reduce((s, p) => s + p.reports.filter(r => r.status === 'soumis' || r.status === 'valide').length, 0);

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
        <MetricCard label="Projets actifs" value={String(projects.length)} note="en cours" accentColor="blue" />
        <MetricCard label="Budget total" value={`${fmt(totalBudget)} €`} note="consolidé" accentColor="teal" />
        <MetricCard label="Dépenses totales" value={`${fmt(totalDepenses)} €`} note="engagées" accentColor="amber" />
        <MetricCard label="Rapports soumis" value={String(totalRapports)} note="sur tous les projets" accentColor="emerald" />
      </div>

      {/* Project Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
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
