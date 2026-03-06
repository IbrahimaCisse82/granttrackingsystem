import { useAppStore } from '@/lib/store';
import { useProjects } from '@/hooks/useProjects';
import { useAutoSave } from '@/hooks/useAutoSave';
import ProjectInfos from '@/components/project/ProjectInfos';
import ProjectBudget from '@/components/project/ProjectBudget';
import ProjectFiche from '@/components/project/ProjectFiche';
import ProjectReport from '@/components/project/ProjectReport';
import ProjectTransactions from '@/components/project/ProjectTransactions';
import ProjectAmendements from '@/components/project/ProjectAmendements';
import SaveIndicator from '@/components/SaveIndicator';
import { useState, useCallback } from 'react';
import type { Project } from '@/lib/mock-data';

export default function ProjectView() {
  const { currentProjectId, currentTab } = useAppStore();
  const { projects, updateProject } = useProjects();
  const project = projects.find(p => p.id === currentProjectId);
  const [saving, setSaving] = useState(false);
  const autoSave = useAutoSave(currentProjectId || '');

  const save = useCallback((partial: Partial<Project>) => {
    setSaving(true);
    autoSave(partial);
    // Reset saving indicator after debounce + network
    setTimeout(() => setSaving(false), 1200);
  }, [autoSave]);

  if (!project) {
    return <p className="p-8 text-muted-foreground">Projet introuvable.</p>;
  }

  const tabMap: Record<string, React.ReactNode> = {
    infos: <ProjectInfos project={project} onSave={save} />,
    budget: <ProjectBudget project={project} onSave={save} />,
    fiche: <ProjectFiche project={project} onSave={save} />,
    amendements: <ProjectAmendements project={project} onSave={save} />,
    'rapport-1': <ProjectReport project={project} reportIndex={0} onSave={save} />,
    'rapport-2': <ProjectReport project={project} reportIndex={1} onSave={save} />,
    'rapport-3': <ProjectReport project={project} reportIndex={2} onSave={save} />,
    'rapport-4': <ProjectReport project={project} reportIndex={3} onSave={save} />,
    'trans-1': <ProjectTransactions project={project} reportIndex={0} onSave={save} />,
    'trans-2': <ProjectTransactions project={project} reportIndex={1} onSave={save} />,
    'trans-3': <ProjectTransactions project={project} reportIndex={2} onSave={save} />,
    'trans-4': <ProjectTransactions project={project} reportIndex={3} onSave={save} />,
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <SaveIndicator saving={saving} />
      </div>
      {tabMap[currentTab] || <p className="p-8 text-muted-foreground italic">Section à venir.</p>}
    </div>
  );
}
