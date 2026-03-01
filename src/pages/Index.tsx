import { useAppStore } from '@/lib/store';
import AppLayout from '@/components/layout/AppLayout';
import Portfolio from '@/pages/Portfolio';
import ProjectView from '@/pages/ProjectView';

export default function Index() {
  const { currentPage } = useAppStore();

  return (
    <AppLayout>
      {currentPage === 'portfolio' && <Portfolio />}
      {currentPage === 'project' && <ProjectView />}
      {currentPage === 'tutoriel' && (
        <div className="text-center py-20 text-muted-foreground">
          <h1 className="text-xl font-bold text-foreground mb-2">Guide d'utilisation</h1>
          <p className="text-sm">Section en cours de développement.</p>
        </div>
      )}
      {currentPage === 'admin' && (
        <div className="text-center py-20 text-muted-foreground">
          <h1 className="text-xl font-bold text-foreground mb-2">Gestion utilisateurs</h1>
          <p className="text-sm">Section en cours de développement.</p>
        </div>
      )}
    </AppLayout>
  );
}
