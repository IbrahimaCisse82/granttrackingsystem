import { useAppStore } from '@/lib/store';
import { useProjects } from '@/hooks/useProjects';
import ProjectInfos from '@/components/project/ProjectInfos';
import ProjectBudget from '@/components/project/ProjectBudget';
import ProjectFiche from '@/components/project/ProjectFiche';
import ProjectReport from '@/components/project/ProjectReport';
import ProjectTransactions from '@/components/project/ProjectTransactions';

export default function ProjectView() {
  const { currentProjectId, currentTab } = useAppStore();
  const { projects } = useProjects();
  const project = projects.find(p => p.id === currentProjectId);

  if (!project) {
    return <p className="p-8 text-muted-foreground">Projet introuvable.</p>;
  }

  const tabMap: Record<string, React.ReactNode> = {
    infos: <ProjectInfos project={project} />,
    budget: <ProjectBudget project={project} />,
    fiche: <ProjectFiche project={project} />,
    'rapport-1': <ProjectReport project={project} reportIndex={0} />,
    'rapport-2': <ProjectReport project={project} reportIndex={1} />,
    'rapport-3': <ProjectReport project={project} reportIndex={2} />,
    'rapport-4': <ProjectReport project={project} reportIndex={3} />,
    'trans-1': <ProjectTransactions project={project} reportIndex={0} />,
    'trans-2': <ProjectTransactions project={project} reportIndex={1} />,
    'trans-3': <ProjectTransactions project={project} reportIndex={2} />,
    'trans-4': <ProjectTransactions project={project} reportIndex={3} />,
  };

  return tabMap[currentTab] || <p className="p-8 text-muted-foreground italic">Section à venir.</p>;
}
