import { useParams, useSearchParams } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useReadOnly } from '@/hooks/useReadOnly';
import { useAppStore } from '@/lib/store';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProjectInfos from '@/components/project/ProjectInfos';
import ProjectBudget from '@/components/project/ProjectBudget';
import ProjectFiche from '@/components/project/ProjectFiche';
import ProjectReport from '@/components/project/ProjectReport';
import ProjectTransactions from '@/components/project/ProjectTransactions';
import ProjectAmendements from '@/components/project/ProjectAmendements';
import ProjectIndicators from '@/components/project/ProjectIndicators';
import ProjectBailleurs from '@/components/project/ProjectBailleurs';
import SaveIndicator from '@/components/SaveIndicator';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { getReportCount } from '@/lib/utils-project';
import type { Project } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const { currentTab, forceSaveCounter, openProject } = useAppStore();
  const { projects, isLoading } = useProjects();
  const project = projects.find(p => p.id === projectId);
  const [saving, setSaving] = useState(false);
  const autoSave = useAutoSave(projectId || '');
  const readOnly = useReadOnly((project as any)?.userId);

  // Sync store with URL params
  useEffect(() => {
    if (projectId) {
      const tab = searchParams.get('tab') || 'infos';
      openProject(projectId, tab);
    }
  }, [projectId, searchParams, openProject]);

  // Force save from Topbar
  useEffect(() => {
    if (forceSaveCounter > 0 && projectId) {
      setSaving(true);
      setTimeout(() => setSaving(false), 1200);
    }
  }, [forceSaveCounter, projectId]);

  const save = useCallback((partial: Partial<Project>) => {
    if (readOnly) return;
    setSaving(true);
    autoSave(partial);
    setTimeout(() => setSaving(false), 1200);
  }, [autoSave, readOnly]);

  const periodicite = project?.periodicite;
  const reportCount = useMemo(() => periodicite ? getReportCount(periodicite) : 0, [periodicite]);

  const tabContent = useMemo(() => {
    if (!project) return null;
    const map: Record<string, React.ReactNode> = {
      infos: <ProjectInfos project={project} onSave={save} readOnly={readOnly} />,
      budget: <ProjectBudget project={project} onSave={save} readOnly={readOnly} />,
      fiche: <ProjectFiche project={project} onSave={save} readOnly={readOnly} />,
      indicateurs: <ProjectIndicators project={project} onSave={save} readOnly={readOnly} />,
      bailleurs: <ProjectBailleurs project={project} onSave={save} readOnly={readOnly} />,
      amendements: <ProjectAmendements project={project} onSave={save} readOnly={readOnly} />,
    };
    for (let i = 1; i <= reportCount; i++) {
      map[`rapport-${i}`] = <ProjectReport project={project} reportIndex={i - 1} onSave={save} readOnly={readOnly} />;
      map[`trans-${i}`] = <ProjectTransactions project={project} reportIndex={i - 1} onSave={save} readOnly={readOnly} />;
    }
    return map[currentTab] || <p className="p-8 text-muted-foreground italic">Section à venir.</p>;
  }, [project, currentTab, reportCount, save, readOnly]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return <p className="p-8 text-muted-foreground">Projet introuvable.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-3 mb-2">
        {readOnly && (
          <span className="rounded-md bg-amber-light px-2.5 py-1 text-[11px] font-semibold text-amber">
            🔒 Mode lecture seule
          </span>
        )}
        <SaveIndicator saving={saving} />
      </div>
      <ErrorBoundary>
        {tabContent}
      </ErrorBoundary>
    </div>
  );
}
