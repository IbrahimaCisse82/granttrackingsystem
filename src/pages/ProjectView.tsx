import { useAppStore } from '@/lib/store';
import { useProjects } from '@/hooks/useProjects';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useReadOnly } from '@/hooks/useReadOnly';
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
import { getReportCount } from '@/lib/mock-data';
import type { Project } from '@/lib/mock-data';

export default function ProjectView() {
  const { currentProjectId, currentTab, forceSaveCounter } = useAppStore();
  const { projects, updateProject } = useProjects();
  const project = projects.find(p => p.id === currentProjectId);
  const [saving, setSaving] = useState(false);
  const autoSave = useAutoSave(currentProjectId || '');
  const readOnly = useReadOnly((project as any)?.userId);

  // Force save from Topbar
  useEffect(() => {
    if (forceSaveCounter > 0 && currentProjectId) {
      // trigger immediate flush by saving empty partial
      setSaving(true);
      setTimeout(() => setSaving(false), 1200);
    }
  }, [forceSaveCounter, currentProjectId]);

  const save = useCallback((partial: Partial<Project>) => {
    if (readOnly) return;
    setSaving(true);
    autoSave(partial);
    setTimeout(() => setSaving(false), 1200);
  }, [autoSave, readOnly]);

  if (!project) {
    return <p className="p-8 text-muted-foreground">Projet introuvable.</p>;
  }

  const reportCount = getReportCount(project.periodicite);

  // Build dynamic tab map
  const tabMap: Record<string, React.ReactNode> = {
    infos: <ProjectInfos project={project} onSave={save} readOnly={readOnly} />,
    budget: <ProjectBudget project={project} onSave={save} readOnly={readOnly} />,
    fiche: <ProjectFiche project={project} onSave={save} readOnly={readOnly} />,
    indicateurs: <ProjectIndicators project={project} onSave={save} readOnly={readOnly} />,
    bailleurs: <ProjectBailleurs project={project} onSave={save} readOnly={readOnly} />,
    amendements: <ProjectAmendements project={project} onSave={save} readOnly={readOnly} />,
  };

  for (let i = 1; i <= reportCount; i++) {
    tabMap[`rapport-${i}`] = <ProjectReport project={project} reportIndex={i - 1} onSave={save} readOnly={readOnly} />;
    tabMap[`trans-${i}`] = <ProjectTransactions project={project} reportIndex={i - 1} onSave={save} readOnly={readOnly} />;
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
      {tabMap[currentTab] || <p className="p-8 text-muted-foreground italic">Section à venir.</p>}
    </div>
  );
}
